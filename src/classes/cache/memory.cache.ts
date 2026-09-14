import { FileCacheStorage, MemoryCacheStorage } from "./storages";
import { BaseCache } from "../base";

export class MemoryCache extends BaseCache {
  public constructor(section?: string) {
    const storage = section
      ? new FileCacheStorage(`./cache/${section}.cache.json`)
      : new MemoryCacheStorage();

    super(storage);
  }
}
