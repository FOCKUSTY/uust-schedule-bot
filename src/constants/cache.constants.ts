import { MS_PER_SECOND } from "./time.constants";

export const CACHE_DEFAULT_MAX_OPERATIONS = 25;
export const CACHE_DEFAULT_DEBOUNCE_MS = 5 * MS_PER_SECOND;
export const CACHE_DIRECTORY = "./cache";
export const CACHE_FILE_SUFFIX = ".cache.json";
export const CACHE_FILE_EMPTY_CONTENT = "{}";
export const CACHE_LOCK_RETRIES = 5;
