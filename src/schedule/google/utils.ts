import { join } from "node:path";

import {
  CREDENTIALS_JSON_FILE,
  FILE_PATH_PREFIX,
  FOLDER_PATH_PREFIX,
  HASH_START,
  QUERY_PARAM_START,
  VIEW_PATH_SEGMENT,
} from "./constants";

/**
 * Возвращает путь к файлу credentials.json по умолчанию.
 */
export const defaultCredentials = (): string => {
  return join(process.cwd(), CREDENTIALS_JSON_FILE);
};

/**
 * Извлекает ID папки или файла из ссылки Google Drive.
 * @param url URL страницы папки или файла на Google Drive
 * @returns ID или null, если извлечь не удалось
 */
export function extractIdFromUrl(url: string): string | null {
  if (!isValidUrl(url)) {
    return null;
  }

  let idCandidate: string | null = null;

  if (url.includes(FOLDER_PATH_PREFIX)) {
    idCandidate = extractSegmentAfterPrefix(url, FOLDER_PATH_PREFIX);
  } else if (url.includes(FILE_PATH_PREFIX)) {
    idCandidate = extractSegmentAfterPrefix(url, FILE_PATH_PREFIX);
  }

  if (!idCandidate) {
    return null;
  }

  return removeTrailingSegments(idCandidate, [VIEW_PATH_SEGMENT]);
}

/**
 * Преобразует диапазон ячеек в нотацию A1.
 * @param startRow Начальная строка (1-based)
 * @param startColumn Начальная колонка (1-based)
 * @param endRow Конечная строка (опционально)
 * @param endColumn Конечная колонка (опционально)
 * @returns Строка вида "A1" или "A1:C10"
 */
export function rangeToA1(
  startRow: number,
  startColumn: number,
  endRow?: number,
  endColumn?: number,
): string {
  if (startRow <= 0 || startColumn <= 0) {
    throw new Error("Индексы строк и колонок должны быть >= 1");
  }
  if (endRow !== undefined && endRow <= 0) {
    throw new Error("Конечная строка должна быть >= 1");
  }
  if (endColumn !== undefined && endColumn <= 0) {
    throw new Error("Конечная колонка должна быть >= 1");
  }

  const startCell = `${columnIndexToLetter(startColumn)}${startRow}`;
  if (endRow === undefined || endColumn === undefined) {
    return startCell;
  }
  const endCell = `${columnIndexToLetter(endColumn)}${endRow}`;
  return `${startCell}:${endCell}`;
}

function isValidUrl(url: unknown): url is string {
  return typeof url === "string" && url.length > 0;
}

function extractSegmentAfterPrefix(url: string, prefix: string): string | null {
  const startIndex = url.indexOf(prefix);
  if (startIndex === -1) {
    return null;
  }

  const idStart = startIndex + prefix.length;
  const remaining = url.slice(idStart);
  const terminatorIndex = remaining.search(/[/?#]/);

  if (terminatorIndex === -1) {
    return remaining;
  }
  return remaining.slice(0, terminatorIndex);
}

function removeTrailingSegments(
  id: string,
  segmentsToRemove: string[],
): string {
  let result = id;

  for (const segment of segmentsToRemove) {
    const index = result.indexOf(segment);
    if (index !== -1) {
      result = result.slice(0, index);
    }
  }

  const queryIndex = result.indexOf(QUERY_PARAM_START);
  if (queryIndex !== -1) {
    result = result.slice(0, queryIndex);
  }

  const hashIndex = result.indexOf(HASH_START);
  if (hashIndex !== -1) {
    result = result.slice(0, hashIndex);
  }

  return result;
}

function columnIndexToLetter(index: number): string {
  let letter = "";
  let temp = index;

  while (temp > 0) {
    const remainder = (temp - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    temp = Math.floor((temp - 1) / 26);
  }
  
  return letter;
}