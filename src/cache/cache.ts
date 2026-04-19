import type { CacheEntry, SerializedCache } from "./types";

import { readFile } from "fs/promises";
import { FileCache } from "./file-cache";

const DEFAULT_TTL_MS = 0;

export class Cache<TValue = unknown> extends FileCache<
  Record<string, SerializedCache<TValue>>
> {
  private memory: Map<string, CacheEntry<TValue>> = new Map();

  public constructor(section: string, folder?: string) {
    super(section, {}, folder);
  }

  public set(key: string, value: TValue, ttlMs: number = DEFAULT_TTL_MS): void {
    const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : undefined;
    this.memory.set(key, { value, expiresAt });
  }

  public get(key: string): TValue | undefined {
    const entry = this.memory.get(key);
    if (!entry) {
      return undefined;
    }

    if (this.isExpired(entry.expiresAt)) {
      this.memory.delete(key);
      return undefined;
    }

    return entry.value;
  }

  public has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  public delete(key: string): boolean {
    return this.memory.delete(key);
  }

  public clear(): void {
    this.memory.clear();
  }

  public cleanExpired(): void {
    for (const [key, entry] of this.memory.entries()) {
      if (this.isExpired(entry.expiresAt)) {
        this.memory.delete(key);
      }
    }
  }

  public keys(): string[] {
    this.cleanExpired();
    return Array.from(this.memory.keys());
  }

  public values(): TValue[] {
    this.cleanExpired();
    return Array.from(this.memory.values(), (entry) => entry.value);
  }

  public entries(): Array<[string, TValue]> {
    this.cleanExpired();
    return Array.from(this.memory.entries(), ([key, entry]) => [
      key,
      entry.value,
    ]);
  }

  public get size(): number {
    this.cleanExpired();
    return this.memory.size;
  }

  public override async load(): Promise<void> {
    try {
      await this.ensureDirectory();
      const content = await readFile(this.filePath, "utf-8");
      const raw = JSON.parse(content) as Record<
        string,
        SerializedCache<TValue>
      >;

      this.memory.clear();

      for (const [key, serialized] of Object.entries(raw)) {
        const expiresAt = serialized.expiresAt
          ? new Date(serialized.expiresAt).getTime()
          : undefined;
        this.memory.set(key, { value: serialized.value, expiresAt });
      }

      this.cleanExpired();
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        this.memory.clear();
        return;
      }

      throw new Error(`Failed to load cache from "${this.filePath}": ${error}`);
    }
  }

  public override async save(): Promise<void> {
    this.cleanExpired();

    const serialized: Record<string, SerializedCache<TValue>> = {};
    for (const [key, entry] of this.memory.entries()) {
      serialized[key] = {
        value: entry.value,
        expiresAt: entry.expiresAt
          ? new Date(entry.expiresAt).toISOString()
          : undefined,
      };
    }

    this.data = serialized;
    await super.save();
  }
}
