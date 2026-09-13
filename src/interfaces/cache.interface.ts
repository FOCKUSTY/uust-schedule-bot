import type { CacheStorage } from "./cache-storage.interface";

export type CacheUseSettings = {
  timeToLiveMs: number;
  maxOperations: number;
  skip: boolean;
};

export type Cache = CacheStorage & {
  use(
    key: string,
    fallback: () => Promise<unknown>,
    settings?: Partial<CacheUseSettings>,
  ): Promise<unknown>;
};
