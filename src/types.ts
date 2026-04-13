import type { drive_v3 } from 'googleapis';

export interface DriveReaderConfig {
  /** Путь к JSON-файлу ключа сервисного аккаунта */
  keyFilePath: string;
  /** Области доступа (по умолчанию только чтение) */
  scopes?: string[];
}

export interface ListFolderOptions {
  /** Количество элементов на страницу (1–1000) */
  pageSize?: number;
  /** Токен следующей страницы */
  pageToken?: string;
  /** Сортировка, например 'folder,name,modifiedTime desc' */
  orderBy?: string;
  /** Поля, возвращаемые API (по умолчанию основные) */
  fields?: string;
  /** Дополнительный фильтр, будет добавлен в q */
  query?: string;
  /** Включать ли файлы из корзины */
  includeTrashed?: boolean;
}

export interface FileInfo {
  id: string;
  name: string;
  mimeType: string;
  size: string | null;
  modifiedTime: string | null;
  createdTime: string | null;
  webViewLink: string | null;
  parents: string[];
  isFolder: boolean;
  raw: drive_v3.Schema$File;
}

export interface ListFolderResult {
  files: FileInfo[];
  nextPageToken?: string | null;
  incompleteSearch: boolean;
}