import { env } from "../env";

import type { CacheStorage } from "./cache-storage.interface";
import { createClient, RedisClientType } from "redis";

export class RedisCacheStorage implements CacheStorage {
  private client: RedisClientType;
  private connected: boolean = false;
  private readonly keyPrefix: string;

  public constructor(keyPrefix: string = "", url: string = env.REDIS_URL) {
    this.client = createClient({ url });
    this.keyPrefix = keyPrefix;
  }

  public async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect();
      this.connected = false;
    }
  }

  private prefixKey(key: string): string {
    return this.keyPrefix ? `${this.keyPrefix}:${key}` : key;
  }

  public async get(key: string): Promise<unknown | undefined> {
    await this.connect();

    const data = await this.client.get(this.prefixKey(key));
    if (!data) {
      return undefined;
    }

    try {
      return JSON.parse(data);
    } catch {
      return undefined;
    }
  }

  public async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    await this.connect();
    
    const serialized = JSON.stringify(value);
    const prefixedKey = this.prefixKey(key);

    if (ttlMs) {
      await this.client.set(prefixedKey, serialized, { PX: ttlMs });
    } else {
      await this.client.set(prefixedKey, serialized);
    }
  }

  public async delete(key: string): Promise<boolean> {
    await this.connect();
    const result = await this.client.del(this.prefixKey(key));
    return result > 0;
  }

  public async clear(): Promise<void> {
    await this.connect();
    const pattern = this.prefixKey("*");
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }

  public async has(key: string): Promise<boolean> {
    await this.connect();
    const exists = await this.client.exists(this.prefixKey(key));
    return exists === 1;
  }

  public async keys(): Promise<string[]> {
    await this.connect();
    const pattern = this.prefixKey("*");
    const prefixedKeys = await this.client.keys(pattern);
    if (!this.keyPrefix) {
      return prefixedKeys;
    }
    const prefixLength = this.keyPrefix.length + 1;
    return prefixedKeys.map((k) => k.slice(prefixLength));
  }
}