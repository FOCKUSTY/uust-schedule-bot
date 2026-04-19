import type { ExcelSheetInfo, SheetRange } from "./types";

import * as XLSX from "xlsx";

import { rangeToA1 } from "./utils";

export interface SheetDimensions {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  rowCount: number;
  columnCount: number;
}

/**
 * Представляет открытую книгу Excel.
 */
export class ExcelWorkbook {
  private readonly workbook: XLSX.WorkBook;

  public constructor(buffer: Buffer) {
    this.workbook = XLSX.read(buffer, { type: "buffer" });
  }

  /**
   * Возвращает список листов с метаинформацией.
   */
  public listSheets(): ExcelSheetInfo[] {
    return this.workbook.SheetNames.map((name, index) => {
      const dimensions = this.getSheetDimensions(name);
      return {
        name,
        index,
        rowCount: dimensions.rowCount,
        columnCount: dimensions.columnCount,
      };
    });
  }

  /**
   * Возвращает размеры используемой области листа.
   * @param sheetNameOrIndex Название или индекс листа
   */
  public getSheetDimensions(
    sheetNameOrIndex: string | number,
  ): SheetDimensions {
    const sheet = this.getSheet(sheetNameOrIndex);
    const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
    return {
      startRow: range.s.r,
      endRow: range.e.r,
      startCol: range.s.c,
      endCol: range.e.c,
      rowCount: range.e.r - range.s.r + 1,
      columnCount: range.e.c - range.s.c + 1,
    };
  }

  /**
   * Возвращает данные листа в виде двумерного массива строк.
   * @param sheetNameOrIndex Название или индекс листа
   * @param range Опциональный диапазон в формате A1 (например, 'A1:C10')
   */
  public getSheetData(
    sheetNameOrIndex: string | number,
    range?: string,
  ): string[][] {
    const sheet = this.getSheet(sheetNameOrIndex);
    const options: XLSX.Sheet2JSONOpts = { header: 1 };
    if (range) {
      options.range = range;
    }
    return XLSX.utils.sheet_to_json(sheet, options) as string[][];
  }

  /**
   * Возвращает все листы в виде объекта { [sheetName]: данные }.
   */
  public getAllSheetsData(): Record<string, string[][]> {
    const result: Record<string, string[][]> = {};
    for (const sheetName of this.workbook.SheetNames) {
      result[sheetName] = this.getSheetData(sheetName);
    }
    return result;
  }

  /**
   * Возвращает данные листа по заданному диапазону (1-based индексы).
   * @param sheetNameOrIndex Название или индекс листа
   * @param range Объект с границами диапазона
   */
  public getSheetDataByRange(
    sheetNameOrIndex: string | number,
    range: SheetRange,
  ): string[][] {
    const { startRow, startCol, endRow, endCol } = range;
    if (endRow === undefined || endCol === undefined) {
      return this.getSheetData(sheetNameOrIndex);
    }
    const a1Range = rangeToA1(startRow, startCol, endRow, endCol);
    return this.getSheetData(sheetNameOrIndex, a1Range);
  }

  private getSheet(sheetNameOrIndex: string | number): XLSX.WorkSheet {
    let sheetName: string;
    if (typeof sheetNameOrIndex === "number") {
      sheetName = this.workbook.SheetNames[sheetNameOrIndex];
      if (!sheetName) {
        throw new Error(`Лист с индексом ${sheetNameOrIndex} не найден`);
      }
    } else {
      sheetName = sheetNameOrIndex;
      if (!this.workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Лист с именем "${sheetName}" не найден`);
      }
    }
    return this.workbook.Sheets[sheetName];
  }
}
