import { FileCacheStorage, MemoryCacheStorage } from "./storages";
import { BaseCache } from "../base";
import { CACHE_DIRECTORY, CACHE_FILE_SUFFIX } from "@/constants";

export class MemoryCache extends BaseCache {
  public constructor(section?: string) {
    const storage = section
      ? new FileCacheStorage(
          `${CACHE_DIRECTORY}/${section}${CACHE_FILE_SUFFIX}`,
        )
      : new MemoryCacheStorage();

    super(storage);
  }
}
