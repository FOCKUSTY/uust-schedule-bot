import type { FileInfo, ExcelSheetInfo, ExcelWorkbook } from "./google";
import { Cache } from "../cache/cache";

import { DriveReader, ExcelReader } from "./google";

/**
 * Сервис для работы с иерархией Google Drive: курсы → специализации → группы.
 */
export class GoogleDriveService {
  private readonly drive: DriveReader;
  private readonly cache: Cache;
  private readonly excelReader: ExcelReader;
  private readonly rootFolderId: string;

  /**
   * @param rootFolderId ID папки, содержащей папки курсов
   * @param drive Экземпляр DriveReader (если не передан, создаётся новый)
   */
  public constructor(rootFolderId: string, dependencies?: {
    drive?: DriveReader,
    cache?: Cache
  }) {
    this.rootFolderId = rootFolderId;
    this.drive = dependencies?.drive ?? new DriveReader();
    this.cache = dependencies?.cache ?? new Cache(process.cwd());
    this.excelReader = new ExcelReader(this.drive);
  }

  /**
   * Возвращает список курсов (папки внутри корневой папки).
   */
  public async getCourses(): Promise<FileInfo[]> {
    const files = await this.drive.listAllFiles(this.rootFolderId);
    return files.filter((file) => file.isFolder);
  }

  /**
   * Возвращает список специализаций для указанного курса.
   * @param courseName Название папки курса
   */
  public async getSpecializations(courseName: string): Promise<FileInfo[]> {
    const courseFolder = await this.findFolderByName(
      this.rootFolderId,
      courseName,
    );
    const files = await this.drive.listAllFiles(courseFolder.id);

    return files.filter((file) => !file.isFolder);
  }

  /**
   * Возвращает список групп (листов) для указанного курса и специализации.
   * @param courseName Название курса
   * @param specializationName Название специализации (имя Excel-файла без расширения)
   */
  public async getGroups(
    courseName: string,
    specializationName: string,
  ): Promise<ExcelSheetInfo[]> {
    const workbook = await this.loadWorkbook(courseName, specializationName);
    return workbook.listSheets();
  }

  /**
   * Загружает книгу Excel для указанного курса и специализации.
   * @param courseName Название курса
   * @param specializationName Название специализации (имя Excel-файла)
   */
  public async loadWorkbook(
    courseName: string,
    specializationName: string,
  ): Promise<ExcelWorkbook> {
    const courseFolder = await this.findFolderByName(
      this.rootFolderId,
      courseName,
    );
    const file = await this.findFileByName(courseFolder.id, specializationName);

    return this.excelReader.loadWorkbook(file.id);
  }

  private async findFolderByName(
    parentId: string,
    name: string,
  ): Promise<FileInfo> {
    const files = await this.drive.listAllFiles(parentId);
    const folder = files.find((file) => file.isFolder && file.name === name);

    if (!folder) {
      throw new Error(`Папка "${name}" не найдена`);
    }

    return folder;
  }

  private async findFileByName(
    parentId: string,
    name: string,
  ): Promise<FileInfo> {
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
