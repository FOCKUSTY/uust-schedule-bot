# Google Drive / Sheets API Reader

Набор классов для чтения данных из Google Drive и Google Sheets через сервисный аккаунт. Поддерживает Excel-файлы и форматирование расписания.

## Установка

```bash
npm install googleapis xlsx
npm install -D @types/node
```

## Использование

### Чтение папок и файлов на Google Drive

```typescript
import { DriveReader, extractIdFromUrl } from "./google";

const reader = new DriveReader({ keyFilePath: "./service-account.json" });
const folderId = extractIdFromUrl("https://drive.google.com/drive/folders/...");
const files = await reader.listAllFiles(folderId);
```

### Чтение Google Sheets

```typescript
import { SheetsReader, extractSpreadsheetIdFromUrl } from "./google";

const sheets = new SheetsReader({ keyFilePath: "./service-account.json" });
const id = extractSpreadsheetIdFromUrl(
  "https://docs.google.com/spreadsheets/d/...",
);
const data = await sheets.getSheetDataByTitle(id, "Лист1");
```

### Чтение Excel‑файлов (.xlsx)

```typescript
import { DriveReader, ExcelReader } from "./google";

const drive = new DriveReader({ keyFilePath: "./service-account.json" });
const excel = new ExcelReader(drive);

const workbook = await excel.loadWorkbook(fileId);
const data = workbook.getSheetDataByRange(0, {
  startRow: 1,
  startCol: 1,
  endRow: 100,
  endCol: 20,
});
```

### Форматирование расписания

```typescript
import { ScheduleFormatter } from "./google";

const raw = workbook.getSheetData(0);
const schedule = new ScheduleFormatter().format(raw);
console.log(schedule.weeks[1]?.days["Понедельник"]?.pairs[1]);
```

## Лицензия

MIT
