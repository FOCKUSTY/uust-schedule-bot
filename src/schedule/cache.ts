import type { CacheType, GroupInformation, ScheduleWeeks } from "./types";
import { getExpiresAtTimeForCache } from "./utils";
import { CACHE_FILE } from "./constants";
import { join } from "path";
import { writeFile } from "fs/promises";
import { existsSync, readFileSync } from "fs";

export class Cache {
  private static readFileSync(): CacheType {
    const path = join(process.cwd(), CACHE_FILE);
    if (!existsSync(path)) {
      return { default: {}, other: {} };
    }
    try {
      const file = readFileSync(path, "utf-8");
      const json = JSON.parse(file);
      return {
        default: json.default || {},
        other: json.other || {},
      };
    } catch {
      return { default: {}, other: {} };
    }
  }

  private _data: CacheType = { default: {}, other: {} };

  public constructor() {
    this._data = Cache.readFileSync();
  }

  public set<T>(prefix: string, data: T) {
    this._data.other[prefix] = data;
    this.writeFile();
  }

  public get<T = unknown>(prefix: string): T {
    return this._data.other[prefix] as T;
  }

  public execute(group: GroupInformation, weeks: ScheduleWeeks) {
    this.addLocal(group, weeks);
    return this.writeFile();
  }

  public getWeeks(group: GroupInformation): ScheduleWeeks | undefined {
    return this._data?.default?.[group.course]?.[group.specialization]?.[group.group]?.weeks;
  }

  private addLocal(group: GroupInformation, weeks: ScheduleWeeks) {
    if (!this.expiresDateReached(group)) {
      return this._data.default?.[group.course]?.[group.specialization]?.[group.group];
    }
    const data = this.createGroup(group, weeks);
    return data;
  }

  private createGroup(group: GroupInformation, weeks: ScheduleWeeks) {
    const data = {
      weeks,
      expiresAt: getExpiresAtTimeForCache(),
    };

    this._data.default = {
      ...this._data.default,
      [group.course]: {
        ...this._data.default?.[group.course],
        [group.specialization]: {
          ...this._data.default?.[group.course]?.[group.specialization],
          [group.group]: data,
        },
      },
    };

    return data;
  }

  private expiresDateReached(group: GroupInformation) {
    const data = this._data.default?.[group.course]?.[group.specialization]?.[group.group];
    if (!data) {
      return true;
    }
    const expiresAt = new Date(data.expiresAt).getTime();
    const now = Date.now();
    return now >= expiresAt;
  }

  private writeFile() {
    const file = join(process.cwd(), CACHE_FILE);
    return writeFile(file, JSON.stringify(this._data, null, 0), "utf-8");
  }
}