import { access, lstatSync, mkdirSync, readFileSync } from 'node:fs';
import type { CacheStorage } from './cache-storage.interface';
import type { SerializedCache } from './types';

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import lockfile from 'proper-lockfile';

const DEFAULT_DEBOUNCE_MS = 2000;

export class FileCacheStorage implements CacheStorage {
  private readonly filePath: string;
  private memory: Map<string, SerializedCache> = new Map();
  private saveTimeout?: NodeJS.Timeout;
  private readonly debounceMs: number;

  public constructor(section: string, folder?: string, debounceMs: number = DEFAULT_DEBOUNCE_MS) {
    const baseDir = folder ? join(process.cwd(), "cache", folder) : join(process.cwd(), 'cache');
    const safeSection = section.replace(/[^a-zA-Z0-9-_]/g, '_');
    this.filePath = join(baseDir, `${safeSection}.cache`);
    this.debounceMs = debounceMs;

    try {
      mkdirSync(join(this.filePath, ".."), { recursive: true });
      readFileSync(this.filePath, "utf-8");
    } catch {
      writeFile(this.filePath, "", "utf-8");
    }
  }

  public async get(key: string): Promise<unknown | undefined> {
    const entry = this.memory.get(key);
    if (!entry) {
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.memory.delete(key);
      return undefined;
    }

    return entry.value;
  }

  public async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    const expiresAt = ttlMs && ttlMs > 0 ? new Date(Date.now() + ttlMs).toISOString() : undefined;
    this.memory.set(key, { value, expiresAt });
    this.scheduleSave();
  }

  public async delete(key: string): Promise<boolean> {
    const deleted = this.memory.delete(key);
    if (deleted) {
      this.scheduleSave();
    }
    return deleted;
  }

  public async clear(): Promise<void> {
    if (this.memory.size > 0) {
      this.memory.clear();
      this.scheduleSave();
    }
  }

  public async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  public async keys(): Promise<string[]> {
    const validKeys: string[] = [];
    for (const [key, entry] of this.memory.entries()) {
      if (!this.isExpired(entry)) {
        validKeys.push(key);
      } else {
        this.memory.delete(key);
      }
    }
    return validKeys;
  }

  public async load(): Promise<void> {
    try {
      await mkdir(join(this.filePath, '..'), { recursive: true });

      const content = await readFile(this.filePath, 'utf-8');
      const raw = JSON.parse(content) as Record<string, SerializedCache>;
      this.memory.clear();
      for (const [key, serialized] of Object.entries(raw)) {
        this.memory.set(key, serialized);
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        this.memory.clear();
        return;
      }
      throw new Error(`Failed to load cache from "${this.filePath}": ${error}`);
    }
  }

  public async save(): Promise<void> {
    // Отменяем запланированное сохранение, т.к. сейчас будет явное
    this.clearSaveTimeout();

    const serialized: Record<string, SerializedCache> = {};
    for (const [key, entry] of this.memory.entries()) {
      if (!this.isExpired(entry)) {
        serialized[key] = entry;
      }
    }

    await mkdir(join(this.filePath, '..'), { recursive: true });

    const release = await lockfile.lock(this.filePath, { retries: 5 });
    try {
      await writeFile(this.filePath, JSON.stringify(serialized, null, 2), 'utf-8');
    } finally {
      await release();
    }
  }

  public stopAutoSave(): void {
    this.clearSaveTimeout();
  }

  private scheduleSave(): void {
    this.clearSaveTimeout();
    this.saveTimeout = setTimeout(async () => {
      await this.save().catch((error) => {
        console.error('Auto-save failed:', error);
      });
      this.saveTimeout = undefined;
    }, this.debounceMs);
  }

  private clearSaveTimeout(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = undefined;
    }
  }

  private isExpired(entry: SerializedCache): boolean {
    if (!entry.expiresAt) {
      return false;
    }
    return Date.now() >= new Date(entry.expiresAt).getTime();
  }
}