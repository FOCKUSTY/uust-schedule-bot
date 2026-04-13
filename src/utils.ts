import { CREDENTIALS_JSON_FILE } from "./constants";
import { join } from "path";

export const defaultCredentials = () => {
  return join(process.cwd(), CREDENTIALS_JSON_FILE);
}

const FOLDER_PATH_PREFIX = '/folders/';
const FILE_PATH_PREFIX = '/file/d/';
const VIEW_PATH_SEGMENT = '/view';
const QUERY_PARAM_START = '?';

/**
 * Извлекает ID папки или файла из ссылки Google Drive.
 * @param url URL страницы папки или файла на Google Drive
 * @returns ID или null, если извлечь не удалось
 */
export function extractIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  let idCandidate: string | null = null;

  if (url.includes(FOLDER_PATH_PREFIX)) {
    idCandidate = extractFromPath(url, FOLDER_PATH_PREFIX);
  } else if (url.includes(FILE_PATH_PREFIX)) {
    idCandidate = extractFromPath(url, FILE_PATH_PREFIX);
  }

  if (!idCandidate) {
    return null;
  }

  return removeTrailingSegments(idCandidate);
}

function extractFromPath(url: string, prefix: string): string | null {
  const startIndex = url.indexOf(prefix);
  if (startIndex === -1) {
    return null;
  }

  const idStart = startIndex + prefix.length;
  const remaining = url.slice(idStart);
  const endIndex = remaining.search(/[\/\?#]/);

  if (endIndex === -1) {
    return remaining;
  }

  return remaining.slice(0, endIndex);
}

function removeTrailingSegments(id: string): string {
  const viewIndex = id.indexOf(VIEW_PATH_SEGMENT);
  if (viewIndex !== -1) {
    return id.slice(0, viewIndex);
  }

  const queryIndex = id.indexOf(QUERY_PARAM_START);
  if (queryIndex !== -1) {
    return id.slice(0, queryIndex);
  }

  return id;
}