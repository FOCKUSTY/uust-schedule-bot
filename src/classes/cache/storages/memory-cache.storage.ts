import type { CacheStorage } from "@/interfaces";
import type { SerializedCache } from "@/types";

export class MemoryCacheStorage implements CacheStorage {
  private readonly _memory: Map<string, SerializedCache<unknown>> = new Map();

  public constructor() {}

  public async get<Value>(key: string): Promise<Value | undefined> {
    const entry = this._memory.get(key);
    if (!entry) {
      return undefined;
    }

    if (this.isExpired(entry)) {
      this._memory.delete(key);
      return undefined;
    }

    return entry.value as Value;
  }

  public async set<Value>(
    key: string,
    value: Value,
    timeToLiveMs?: number,
  ): Promise<Value> {
    const expiresAt = this.getExpiresAt(timeToLiveMs);
    this._memory.set(key, { value, expiresAt });
    return value;
  }

  public async delete(key: string): Promise<boolean> {
    return this._memory.delete(key);
  }

  public async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  public async clear(): Promise<void> {
    this._memory.clear();
  }

  public async keys(): Promise<string[]> {
    return Array.from(this._memory.keys());
  }

  public async load(): Promise<void> {}
  public async save(): Promise<void> {}
  public async stopAutoSave(): Promise<void> {}

  private getExpiresAt(timeToLiveMs?: number): string | undefined {
    if (!timeToLiveMs || timeToLiveMs <= 0) {
      return undefined;
    }

    return new Date(Date.now() + timeToLiveMs).toISOString();
  }

  private isExpired<Value>(entry: SerializedCache<Value>): boolean {
    if (!entry.expiresAt) {
      return false;
    }

    return Date.now() >= new Date(entry.expiresAt).getTime();
  }
}
