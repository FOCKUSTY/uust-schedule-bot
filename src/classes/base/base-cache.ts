import { CACHE_DEFAULT_MAX_OPERATIONS } from "@/constants";
import { Cache, CacheStorage, CacheUseSettings } from "@/interfaces";

export abstract class BaseCache implements Cache {
  private readonly _operations: Record<string, number> = {};

  public constructor(private readonly storage: CacheStorage) {}

  public use<Value>(
    key: string,
    fallback: () => Promise<Value>,
    settings?: Partial<CacheUseSettings>,
  ): Promise<Value> {
    const {
      maxOperations = CACHE_DEFAULT_MAX_OPERATIONS,
      skip,
      timeToLiveMs,
    } = settings || {};

    if (skip) {
      return fallback();
    }

    this._operations[key] ??= 0;

    return new Promise<Value>(async (resolve, reject) => {
      let resolved: boolean = false;

      const cached = (await this.storage.get(key)) as Value | undefined;
      if (cached !== undefined) {
        this._operations[key] = this._operations[key] + 1;
        resolved = true;
        resolve(cached);

        if (maxOperations > this._operations[key]) {
          return;
        }
      }

      try {
        const value = await fallback();
        await this.storage.set(key, value, timeToLiveMs);

        if (!resolved) {
          this._operations[key] = 0;
          return resolve(value);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  public get<Value>(key: string): Promise<Value | undefined> {
    return this.storage.get(key);
  }

  public set<Value>(
    key: string,
    value: Value,
    timeToLiveMs?: number,
  ): Promise<Value> {
    return this.storage.set(key, value, timeToLiveMs);
  }

  public delete(key: string): Promise<boolean> {
    return this.storage.delete(key);
  }

  public has(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  public clear(): Promise<void> {
    return this.storage.clear();
  }

  public keys(): Promise<string[]> {
    return this.storage.keys();
  }

  public load(): Promise<void> {
    return this.storage.load();
  }

  public save(): Promise<void> {
    return this.storage.save();
  }

  public stopAutoSave(): Promise<void> {
    return this.storage.stopAutoSave();
  }
}
