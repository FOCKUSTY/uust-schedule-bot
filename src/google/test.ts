import { env } from "./env";

import { DriveReader } from "./drive.reader";
import { ExcelReader } from "./excel.reader";

import { extractIdFromUrl } from "./utils";
import { writeFileSync } from "node:fs";
import { ScheduleFormatter } from "../formatter";

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
  const formatter = new ScheduleFormatter();

  const fileUrl = "https://drive.google.com/file/d/17ICYlOQsiNCFTwDkIfC4T5e-0878_5Sn/view";
  const fileId = extractIdFromUrl(fileUrl);
  if (!fileId) {
    throw new Error('Не удалось извлечь ID файла');
  }

  const workbook = await excelReader.loadWorkbook(fileId);

  // Список листов
  console.log('Листы:', workbook.listSheets());

  // Данные первого листа
  const dims = workbook.getSheetDimensions(0);
  const firstSheetData = workbook.getSheetDataByRange(0, {
    ...dims,
    startRow: 1,
    startCol: 1
  });
  // console.log('Данные первого листа:', firstSheetData);
  const schedule = formatter.format(firstSheetData);

  writeFileSync("./.txt", JSON.stringify(schedule, undefined, 2), "utf-8");

  // Все листы сразу
  // const allData = workbook.getAllSheetsData();
  // console.log('Все данные:', allData);
}

main().catch(console.error);