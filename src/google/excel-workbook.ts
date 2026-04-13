import * as XLSX from 'xlsx';
import type { ExcelSheetInfo } from './types';

/**
 * Представляет открытую книгу Excel.
 */
export class ExcelWorkbook {
  private readonly workbook: XLSX.WorkBook;

  public constructor(buffer: Buffer) {
    this.workbook = XLSX.read(buffer, { type: 'buffer' });
  }

  /**
   * Возвращает список листов с метаинформацией.
   */
  public listSheets(): ExcelSheetInfo[] {
    return this.workbook.SheetNames.map((name, index) => {
      const sheet = this.workbook.Sheets[name];
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      return {
        name,
        index,
        rowCount: range.e.r - range.s.r + 1,
        columnCount: range.e.c - range.s.c + 1,
      };
    });
  }

  /**
   * Возвращает данные листа в виде двумерного массива строк.
   * @param sheetNameOrIndex Название или индекс листа
   */
  public getSheetData(sheetNameOrIndex: string | number): string[][] {
    const sheet = this.getSheet(sheetNameOrIndex);
    return XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
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

  private getSheet(sheetNameOrIndex: string | number): XLSX.WorkSheet {
    let sheetName: string;
    if (typeof sheetNameOrIndex === 'number') {
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