import type { drive_v3 } from 'googleapis';
import type { Readable } from 'stream';
import type {
  DriveReaderConfig,
  ListFolderOptions,
  ListFolderResult,
  FileInfo,
} from './types';

import { google } from 'googleapis';

import {
  DEFAULT_READONLY_SCOPES,
  DEFAULT_PAGE_SIZE,
  DEFAULT_FIELDS,
  TRASHED_FILTER,
  GOOGLE_DRIVE_API_VERSION,
  FOLDER_MIME_TYPE,
  DOWNLOAD_ALT_MEDIA,
  STREAM_RESPONSE_TYPE,
  FILE_FIELDS_FOR_INFO,
} from './constants';

import { defaultCredentials } from "./utils";

/**
 * Класс для чтения данных Google Drive через сервисный аккаунт.
 */
export class DriveReader {
  private readonly drive: drive_v3.Drive;

  /**
   * @param config Конфигурация с путём к ключу сервисного аккаунта
   */
  public constructor(config?: Partial<DriveReaderConfig>) {
    const scopes = config?.scopes ?? DEFAULT_READONLY_SCOPES;

    const auth = new google.auth.GoogleAuth({
      keyFile: config?.keyFilePath || defaultCredentials(),
      scopes,
    });

    this.drive = google.drive({ version: GOOGLE_DRIVE_API_VERSION, auth });
  }

  /**
   * Возвращает одну страницу содержимого папки.
   * @param folderId ID папки
   * @param options Параметры запроса
   */
  public async listFolder(
    folderId: string,
    options: ListFolderOptions = {}
  ): Promise<ListFolderResult> {
    const {
      pageSize = DEFAULT_PAGE_SIZE,
      pageToken,
      orderBy,
      fields = DEFAULT_FIELDS,
      query: extraQuery,
      includeTrashed = false,
    } = options;

    const queryParts = [`'${folderId}' in parents`];

    if (!includeTrashed) {
      queryParts.push(TRASHED_FILTER);
    }
    if (extraQuery) {
      queryParts.push(`(${extraQuery})`);
    }

    const query = queryParts.join(' and ');

    const response = await this.drive.files.list({
      q: query,
      pageSize,
      pageToken,
      orderBy,
      fields,
    });

    const files = (response.data.files || []).map(file => this.mapToFileInfo(file));

    return {
      files,
      nextPageToken: response.data.nextPageToken,
      incompleteSearch: response.data.incompleteSearch || false,
    };
  }

  /**
   * Получает все файлы из папки.
   * @param folderId ID папки
   * @param recursive Если true, будут также собраны файлы из подпапок
   * @param options Параметры запроса (без pageToken)
   */
  public async listAllFiles(
    folderId: string,
    recursive: boolean = false,
    options: Omit<ListFolderOptions, 'pageToken'> = {}
  ): Promise<FileInfo[]> {
    const allFiles: FileInfo[] = [];
    let pageToken: string | undefined;

    do {
      const result = await this.listFolder(folderId, { ...options, pageToken });
      allFiles.push(...result.files);

      if (!recursive) {
        pageToken = result.nextPageToken || undefined;
        continue;
      }

      for (const file of result.files) {
        if (file.isFolder) {
          const subFiles = await this.listAllFiles(file.id, true, options);
          allFiles.push(...subFiles);
        }
      }

      pageToken = result.nextPageToken || undefined;
    } while (pageToken);

    return allFiles;
  }

  /**
   * Возвращает информацию об одном файле или папке.
   * @param fileId ID файла
   */
  public async getFileInfo(fileId: string): Promise<FileInfo> {
    const response = await this.drive.files.get({
      fileId,
      fields: FILE_FIELDS_FOR_INFO,
    });

    return this.mapToFileInfo(response.data);
  }

  /**
   * Скачивает бинарное содержимое файла в виде Readable-потока.
   * @param fileId ID файла
   */
  public async downloadFile(fileId: string): Promise<Readable> {
    const response = await this.drive.files.get(
      { fileId, alt: DOWNLOAD_ALT_MEDIA },
      { responseType: STREAM_RESPONSE_TYPE }
    );

    return response.data;
  }

  /**
   * Экспортирует файл Google Workspace (Docs, Sheets, Slides) в указанный формат.
   * @param fileId ID файла
   * @param mimeType Целевой MIME-тип, например 'application/pdf'
   */
  public async exportFile(fileId: string, mimeType: string): Promise<Readable> {
    const response = await this.drive.files.export(
      { fileId, mimeType },
      { responseType: STREAM_RESPONSE_TYPE }
    );

    return response.data;
  }

  private mapToFileInfo(file: drive_v3.Schema$File): FileInfo {
    return {
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      size: file.size || null,
      modifiedTime: file.modifiedTime || null,
      createdTime: file.createdTime || null,
      webViewLink: file.webViewLink || null,
      parents: file.parents || [],
      isFolder: file.mimeType === FOLDER_MIME_TYPE,
      raw: file,
    };
  }
}