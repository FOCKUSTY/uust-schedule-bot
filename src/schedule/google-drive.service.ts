// google-drive.service.ts
import type { FileInfo, ExcelSheetInfo, ExcelWorkbook } from "./google";
import { Cache } from "../cache/cache";
import { DriveReader, ExcelReader } from "./google";
import { CACHE_TTL } from "./constants";

export class GoogleDriveService {
  private readonly drive: DriveReader;
  private readonly cache: Cache;
  private readonly excelReader: ExcelReader;
  private readonly rootFolderId: string;

  public constructor(
    rootFolderId: string,
    dependencies?: {
      drive?: DriveReader;
      cache?: Cache;
    },
  ) {
    this.rootFolderId = rootFolderId;
    this.drive = dependencies?.drive ?? new DriveReader();
    this.cache = dependencies?.cache ?? new Cache("google-drive");
    this.excelReader = new ExcelReader(this.drive);
  }

  public async getCourses(): Promise<FileInfo[]> {
    const cacheKey = 'courses';
    const cached = await this.cache.get<FileInfo[]>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const files = await this.drive.listAllFiles(this.rootFolderId);
    const courses = files.filter((file) => file.isFolder);

    await this.cache.set(cacheKey, courses, CACHE_TTL.COURSES);
    return courses;
  }

  public async getSpecializations(courseName: string): Promise<FileInfo[]> {
    const cacheKey = `${courseName}:specializations`;
    const cached = await this.cache.get<FileInfo[]>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const courseFolder = await this.findFolderByName(this.rootFolderId, courseName);
    const files = await this.drive.listAllFiles(courseFolder.id);
    const specializations = files.filter((file) => !file.isFolder);

    await this.cache.set(cacheKey, specializations, CACHE_TTL.SPECIALIZATIONS);
    return specializations;
  }

  public async getGroups(courseName: string, specializationName: string): Promise<ExcelSheetInfo[]> {
    const cacheKey = `${courseName}:${specializationName}:groups`;
    const cached = await this.cache.get<ExcelSheetInfo[]>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const workbook = await this.loadWorkbook(courseName, specializationName);
    const groups = workbook.listSheets();

    await this.cache.set(cacheKey, groups, CACHE_TTL.GROUPS);
    return groups;
  }

  /**
   * Загружает книгу Excel. Не кэшируется, так как ExcelWorkbook содержит методы и несериализуем.
   * При необходимости можно добавить in‑memory кэш на уровне сервиса.
   */
  public async loadWorkbook(
    courseName: string,
    specializationName: string,
  ): Promise<ExcelWorkbook> {
    const courseFolder = await this.findFolderByName(this.rootFolderId, courseName);
    const file = await this.findFileByName(courseFolder.id, specializationName);
    return this.excelReader.loadWorkbook(file.id);
  }

  private async findFolderByName(parentId: string, name: string): Promise<FileInfo> {
    const files = await this.drive.listAllFiles(parentId);
    const folder = files.find((file) => file.isFolder && file.name === name);
    if (!folder) {
      throw new Error(`Папка "${name}" не найдена`);
    }
    return folder;
  }

  private async findFileByName(parentId: string, name: string): Promise<FileInfo> {
    const files = await this.drive.listAllFiles(parentId);
    const file = files.find((file) => {
      return (
        !file.isFolder &&
        (file.name === name ||
          file.name === `${name}.xlsx` ||
          file.name === `${name}.xls`)
      );
    });
    if (!file) {
      throw new Error(`Файл "${name}" не найден`);
    }
    return file;
  }
}
