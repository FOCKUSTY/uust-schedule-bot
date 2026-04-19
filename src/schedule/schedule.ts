import { env } from "../env";

import type { FileData, GroupInformation, Specializations } from "./types";

import {
  DriveReader,
  extractIdFromUrl,
  ExcelReader,
  FileInfo,
  ExcelSheetInfo,
} from "./google";
import { ScheduleFormatter } from "./formatter";

import { getCurrentWeek } from "./utils";
import { Cache } from "./cache";

const cache = new Cache();

const COURSE_FOLDER_ID = extractIdFromUrl(env.GOOGLE_DRIVE_FOLDER_URL)!;
if (!COURSE_FOLDER_ID) {
  throw new Error("Bad URL.");
}

export class Schedule {
  public static async getCourses() {
    const cachedCourses = cache.get<FileInfo[]>("courses");
    if (cachedCourses) {
      return cachedCourses;
    }

    const drive = new DriveReader();
    const courses = await drive.listAllFiles(COURSE_FOLDER_ID);

    cache.set("courses", courses);

    return courses;
  }

  public static async getSpecializations({
    course,
  }: Pick<GroupInformation, "course">) {
    const specializations = cache.get<FileInfo[]>(`specializations:${course}`);
    if (specializations) {
      return specializations;
    }

    const drive = new DriveReader();
    const courseFolder = await this.getFileFromFolder(drive, {
      name: course,
      folderId: COURSE_FOLDER_ID,
    });

    const files = await drive.listAllFiles(courseFolder.id);
    cache.set(`specializations:${course}`, files);

    return files;
  }

  public static async getGroups({
    course,
    specialization,
  }: Pick<GroupInformation, "course" | "specialization">) {
    const groups = cache.get<ExcelSheetInfo[]>(
      `groupes:${course}:${specialization}`,
    );
    if (groups) {
      return groups;
    }

    const drive = new DriveReader();
    const courseFolder = await Schedule.getFileFromFolder(drive, {
      name: course,
      folderId: COURSE_FOLDER_ID,
    });

    const file = await Schedule.getFileFromFolder(drive, {
      name: specialization,
      folderId: courseFolder.id,
    });

    const excel = new ExcelReader(drive);
    const wordbook = await excel.loadWorkbook(file.id);
    const lists = wordbook.listSheets();

    cache.set(`groupes:${course}:${specialization}`, lists);

    return lists;
  }

  private static async getFileFromFolder(
    drive: DriveReader,
    { folderId, name, extension }: FileData,
  ) {
    const files = await drive.listAllFiles(folderId);
    const file = files.filter((file) => {
      if (extension) {
        return file.name === `${name}.${extension}`;
      }

      return file.name === name;
    })[0];

    if (!file) {
      throw new Error(`File ${name} not found`);
    }

    return file;
  }

  private _config: GroupInformation;
  private _week: number;

  public constructor(
    config: GroupInformation,
    week: number = getCurrentWeek(),
  ) {
    this._config = config;
    this._week = week;
  }

  public get config() {
    return this._config;
  }

  public async execute() {
    const cachedWeeks = this.getFromCache();
    if (cachedWeeks) {
      return cachedWeeks[`${this._week}`].days;
    }

    const drive = new DriveReader();

    const courseFolder = await Schedule.getFileFromFolder(drive, {
      name: this._config.course,
      folderId: COURSE_FOLDER_ID,
    });

    const file = await Schedule.getFileFromFolder(drive, {
      name: this._config.specialization,
      folderId: courseFolder.id,
    });

    const excel = new ExcelReader(drive);
    const wordbook = await excel.loadWorkbook(file.id);
    const lists = wordbook.listSheets();
    const list = lists.filter((list) => list.name === this._config.group)[0];
    if (!list) {
      throw new Error("Groud not found.");
    }

    const dimensions = wordbook.getSheetDimensions(list.name);
    const data = wordbook.getSheetDataByRange(list.name, {
      ...dimensions,
      startRow: 1,
      startCol: 1,
    });

    const formatter = new ScheduleFormatter();
    const schedule = formatter.format(data);

    cache.execute(this._config, schedule.weeks);

    const week = schedule.weeks[`${this._week}`].days;
    return week;
  }

  public getFromCache() {
    return cache.getWeeks(this._config);
  }

  public setGroup({ group }: Pick<GroupInformation, "group">) {
    this._config.group = group;
  }

  public setSpecialization({
    group,
    specialization,
  }: Pick<GroupInformation, "specialization" | "group">) {
    this._config.group = group;
    this._config.specialization = specialization;
  }

  public setCourse(config: GroupInformation) {
    this._config = config;
  }

  public setWeek(week: number) {
    this._week = week;
  }
}
