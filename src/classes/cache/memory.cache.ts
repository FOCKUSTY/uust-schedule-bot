import { FileCacheStorage, MemoryCacheStorage } from "./storages";
import { BaseCache } from "../base";

export class MemoryCache extends BaseCache {
  public constructor(useFileSystem: boolean = true) {
    const storage = useFileSystem
      ? new FileCacheStorage("./cache/memory.cache.json")
      : new MemoryCacheStorage();

    super(storage);
  }
}
