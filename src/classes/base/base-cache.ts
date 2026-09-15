import { CACHE_DEFAULT_MAX_OPERATIONS } from "@/constants";
import { Cache, CacheStorage, CacheUseSettings } from "@/interfaces";

export abstract class BaseCache implements Cache {
  private readonly _operations: Record<string, number> = {};
  private readonly _in_flight: Map<string, Promise<unknown>> = new Map();

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

    const inFlight = this._in_flight.get(key) as Promise<Value> | undefined;
    if (inFlight) {
      return inFlight;
    }

    const promise = this.execute(key, fallback, {
      maxOperations,
      timeToLiveMs,
    }).finally(() => {
      this._in_flight.delete(key);
    });

    this._in_flight.set(key, promise);
    return promise;
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

  private async execute<Value>(
    key: string,
    fallback: () => Promise<Value>,
    settings: { maxOperations: number; timeToLiveMs?: number },
  ): Promise<Value> {
    this._operations[key] ??= 0;

    const cached = (await this.storage.get(key)) as Value | undefined;
    if (cached !== undefined) {
      this._operations[key] = this._operations[key] + 1;

      if (settings.maxOperations > this._operations[key]) {
        return cached;
      }
    }

    const value = await fallback();
    await this.storage.set(key, value, settings.timeToLiveMs);

    this._operations[key] = 0;

    return value;
  }
}
