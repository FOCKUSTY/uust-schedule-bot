import type { drive_v3 } from "googleapis";

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

export interface ExcelSheetInfo {
  /** Название листа */
  name: string;
  /** Индекс листа (начиная с 0) */
  index: number;
  /** Количество строк (приблизительное) */
  rowCount: number;
  /** Количество колонок (приблизительное) */
  columnCount: number;
}

export interface ExcelWorkbookData {
  /** Список листов */
  sheets: ExcelSheetInfo[];
  /** Сырой объект workbook из библиотеки xlsx */
  raw: unknown;
}

export interface SheetRange {
  /** Начальная строка (1-based) */
  startRow: number;
  /** Начальная колонка (1-based) */
  startCol: number;
  /** Конечная строка (1-based, опционально) */
  endRow?: number;
  /** Конечная колонка (1-based, опционально) */
  endCol?: number;
}
