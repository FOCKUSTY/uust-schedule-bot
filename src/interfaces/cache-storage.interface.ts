export type CacheStorageUseSettings = {
  timeToLiveMs: number;
  maxOperations: number;
  skip: boolean;
};

export type CacheStorage = {
  get<Value>(key: string): Promise<Value | undefined>;
  set<Value>(key: string, value: Value, timeToLiveMs?: number): Promise<Value>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;

  load(): Promise<void>;
  save(): Promise<void>;
  stopAutoSave(): Promise<void>;
};
