import type { CacheStorage } from './cache-storage.interface';
import { FileCacheStorage } from './file-cache-storage';
import { TWO_HOURS_MS } from './constants';

export class Cache {
  private storage: CacheStorage;

  public constructor(section: string, folder?: string, debounceMs?: number);
  public constructor(storage: CacheStorage);
  public constructor(storageOrSection: CacheStorage | string, folder?: string, debounceMs?: number) {
    if (typeof storageOrSection === 'string') {
      this.storage = new FileCacheStorage(storageOrSection, folder, debounceMs);
    } else {
      this.storage = storageOrSection;
    }
  }

  public async set<Value>(key: string, value: Value, ttlMs: number = TWO_HOURS_MS): Promise<void> {
    await this.storage.set(key, value, ttlMs);
  }

  public async get<Value>(key: string): Promise<Value | undefined> {
    const value = await this.storage.get(key);
    return value as Value | undefined;
  }

  public async has(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  public async delete(key: string): Promise<boolean> {
    return this.storage.delete(key);
  }

  public async clear(): Promise<void> {
    await this.storage.clear();
  }

  public async keys(): Promise<string[]> {
    return this.storage.keys();
  }

  public async load(): Promise<void> {
    if ('load' in this.storage && typeof (this.storage as any).load === 'function') {
      await (this.storage as any).load();
    }
  }

  public async save(): Promise<void> {
    if ('save' in this.storage && typeof (this.storage as any).save === 'function') {
      await (this.storage as any).save();
    }
  }

  public stopAutoSave(): void {
    if ('stopAutoSave' in this.storage && typeof (this.storage as any).stopAutoSave === 'function') {
      (this.storage as any).stopAutoSave();
    }
  }
}