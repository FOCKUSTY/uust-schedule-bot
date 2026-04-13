import { env } from "./env";

import { DriveReader } from "./drive.reader";
import { ExcelReader } from "./excel.reader";

import { extractIdFromUrl } from "./utils";

/* (async () => {
  const reader = new DriveReader();

  const id = extractIdFromUrl(env.GOOGLE_DRIVE_FOLDER_URL);
  if (!id) {
    throw new Error("Bad URL");
  }

  const { files } = await reader.listFolder(id);
  
  console.log({files});
})(); */

async function main() {
  const driveReader = new DriveReader();
  const excelReader = new ExcelReader(driveReader);

  const fileUrl = "https://drive.google.com/file/d/17ICYlOQsiNCFTwDkIfC4T5e-0878_5Sn/view";
  const fileId = extractIdFromUrl(fileUrl);
  if (!fileId) {
    throw new Error('Не удалось извлечь ID файла');
  }

  const workbook = await excelReader.loadWorkbook(fileId);

  // Список листов
  console.log('Листы:', workbook.listSheets());

  // Данные первого листа
  // const firstSheetData = workbook.getSheetData(0);
  // console.log('Данные первого листа:', firstSheetData);

  // Все листы сразу
  // const allData = workbook.getAllSheetsData();
  // console.log('Все данные:', allData);
}

main().catch(console.error);