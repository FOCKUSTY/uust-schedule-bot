import type { CacheType, GroupInformation, ScheduleWeeks } from "./types";

import { getExpiresAtTimeForCache } from "./utils";
import { CACHE_FILE } from "./constants";

import { join } from "path";

import { writeFile } from "fs/promises";
import { existsSync, readFileSync } from "fs";

export class Cache {
  private static readFileSync() {
    const path = join(process.cwd(), CACHE_FILE);
    
    if (!existsSync(path)) {
      return {};
    };

    const file = readFileSync(path, "utf-8");
    const json = JSON.parse(file);
    return json;
  }

  private _data: CacheType = {};

  public constructor() {
    this._data = Cache.readFileSync();
  }

  public execute(group: GroupInformation, weeks: ScheduleWeeks) {
    this.addLocal(group, weeks);
    return this.writeFile();
  }

  public get(group: GroupInformation): ScheduleWeeks|undefined {
    return this._data?.[group.course]?.[group.specialization]?.[group.group]?.weeks;
  }

  private addLocal(group: GroupInformation, weeks: ScheduleWeeks) {
    if (this.expiresDateReached(group)) {
      return this._data?.[group.course]?.[group.specialization]?.[group.group];
    }

    const data = this.createGroup(group, weeks);
    return data;
  }

  private createGroup(group: GroupInformation, weeks: ScheduleWeeks) {
    const data = {
      weeks,
      expiresAt: getExpiresAtTimeForCache()
    };

    this._data = {
      [group.course]: {
        [group.specialization]: {
          [group.group]: data,
          ...this._data?.[group.course]?.[group.specialization],
        },
        ...this._data?.[group.course],
      },
      ...this._data,
    }

    return data;
  }

  private expiresDateReached(group: GroupInformation) {
    const data = this._data?.[group.course]?.[group.specialization]?.[group.group];
    if (!data) {
      return false;
    }

    const expiresAt = new Date(data.expiresAt).getTime();
    const now = new Date().getTime();

    return now >= expiresAt;
  }

  private writeFile() {
    const file = join(process.cwd(), CACHE_FILE);
    return writeFile(file, JSON.stringify(this._data, undefined, 0), "utf-8");
  }
}