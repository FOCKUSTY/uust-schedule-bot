import type { CacheStorage } from "@/interfaces";
import type { SerializedCache } from "@/types";

import { access, mkdir, readFile, writeFile } from "fs/promises";
import { lock } from "proper-lockfile";
import { dirname } from "path";

export class FileCacheStorage implements CacheStorage {
  private readonly _memory: Map<string, SerializedCache<unknown>> = new Map();
  private readonly _dir: string;
  private _save_timeout?: NodeJS.Timeout | null;

  private _initialized: boolean = false;

  public constructor(
    private readonly filePath: string,
    private readonly debounceMs: number = 5000, // TODO: перенести в constants/
  ) {
    this._dir = dirname(filePath);
  }

  public async get<Value>(key: string): Promise<Value | undefined> {
    await this.initialize();

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
    await this.initialize();

    const expiresAt = this.getExpiresAt(timeToLiveMs);
    this._memory.set(key, { value, expiresAt });
    await this.scheduleSave();

    return value;
  }

  public async delete(key: string): Promise<boolean> {
    const deleted = this._memory.delete(key);
    if (deleted) {
      await this.scheduleSave();
    }

    return deleted;
  }

  public async has(key: string): Promise<boolean> {
    const value = this.get(key);
    if (!value) {
      return false;
    }

    return value !== undefined;
  }

  public async clear(): Promise<void> {
    this._memory.clear();
    this.scheduleSave();
  }

  public async keys(): Promise<string[]> {
    return Array.from(this._memory.keys());
  }

  public async load(): Promise<void> {
    await this.initialize();

    const content = await readFile(this.filePath, "utf-8");
    const cache = JSON.parse(content) as Record<
      string,
      SerializedCache<unknown>
    >;
    this._memory.clear();
    Object.entries(cache).forEach(([key, value]) => {
      this._memory.set(key, value);
    });
  }

  public async save(): Promise<void> {
    await this.initialize();
    await this.clearSaveTimeout();

    const cache: Record<string, SerializedCache<unknown>> = {};
    this._memory.forEach((value, key) => {
      if (this.isExpired(value)) {
        return;
      }

      cache[key] = value;
    });

    const release = await lock(this.filePath, { retries: 5 });
    try {
      await writeFile(this.filePath, JSON.stringify(cache, null, 0), "utf-8");
    } finally {
      return release();
    }
  }

  public async stopAutoSave(): Promise<void> {
    return this.clearSaveTimeout();
  }

  private async scheduleSave() {
    await this.clearSaveTimeout();
    this._save_timeout = setTimeout(async () => {
      try {
        await this.save();
      } catch (error) {
        console.log("Auto-save failed", error);
      }

      this._save_timeout = null;
    }, this.debounceMs);
  }

  private async clearSaveTimeout() {
    if (!this._save_timeout) {
      return;
    }

    clearTimeout(this._save_timeout);
    this._save_timeout = null;
  }

  private getExpiresAt(timeToLiveMs?: number) {
    if (!timeToLiveMs) {
      return undefined;
    }

    if (timeToLiveMs <= 0) {
      return undefined;
    }

    const expiresAt = new Date(Date.now() + timeToLiveMs).toISOString();
    return expiresAt;
  }

  private isExpired<Value>(entry: SerializedCache<Value>) {
    if (!entry.expiresAt) {
      return false;
    }

    return Date.now() >= new Date(entry.expiresAt).getTime();
  }

  private async initialize() {
    if (this._initialized) {
      return;
    }

    try {
      await access(this.filePath);
      this._initialized = true;
    } catch {
      await mkdir(this._dir, { recursive: true });
      await writeFile(this.filePath, "{}", "utf-8");
    }
  }
}
