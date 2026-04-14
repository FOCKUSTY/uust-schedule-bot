// ====================== ОБЩИЕ ======================
export const STREAM_RESPONSE_TYPE = 'stream';
export const CREDENTIALS_JSON_FILE = "credentials.json";


// ====================== GOOGLE DRIVE ======================
export const DRIVE_API_VERSION = 'v3';
export const DRIVE_READONLY_SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

export const DEFAULT_PAGE_SIZE = 100;
export const DEFAULT_FIELDS =
  'nextPageToken, files(id, name, mimeType, size, modifiedTime, createdTime, webViewLink, parents)';

export const TRASHED_FILTER = 'trashed = false';
export const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
export const DOWNLOAD_ALT_MEDIA = 'media';
export const FILE_FIELDS_FOR_INFO =
  'id, name, mimeType, size, modifiedTime, createdTime, webViewLink, parents';

// ====================== GOOGLE SHEETS ======================
export const SHEETS_API_VERSION = 'v4';
export const SHEETS_READONLY_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';

export const SPREADSHEET_MIME_TYPE = 'application/vnd.google-apps.spreadsheet';
export const DEFAULT_RANGE = 'A1:Z1000';
export const DEFAULT_SHEET_TITLE = 'Sheet1';
export const CSV_EXPORT_MIME_TYPE = 'text/csv';

// ====================== URL EXTRACTION ======================
export const FOLDER_PATH_PREFIX = '/folders/';
export const FILE_PATH_PREFIX = '/file/d/';
export const SPREADSHEET_PATH_PREFIX = '/spreadsheets/d/';
export const D_PATH_PREFIX = '/d/';

export const VIEW_PATH_SEGMENT = '/view';
export const EDIT_PATH_SEGMENT = '/edit';
export const QUERY_PARAM_START = '?';
export const HASH_START = '#';