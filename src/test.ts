import { writeFileSync } from "fs";
import { Schedule } from "./schedule";
import { ExcelReader } from "./google/excel.reader";
import { DriveReader, extractIdFromUrl } from "./google";

(async () => {
  const schedule = new Schedule({
    course: "1 курс",
    specialization: "11.02.17 Разработка электронных устройств и систем",
    group: "РЭУ1225",
  });

  const json = await schedule.execute();
  
  writeFileSync("./.txt", JSON.stringify(json, undefined, 2), "utf-8");
})();

/* (async () => {
  const drive = new DriveReader();
  const excel = new ExcelReader(drive);
  
  const id = "1nBoIFA_oecHmkkwDU84te4k04s8zOayL"
  if (!id) {
    throw new Error("Bad URL.");
  }

  const workbook = await excel.loadWorkbook(id);
  console.log(workbook);
})(); */