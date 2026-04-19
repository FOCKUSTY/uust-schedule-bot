import type { Readable } from "stream";
import { DriveReader } from "./drive.reader";
import { ExcelWorkbook } from "./excel-workbook";

/**
 * Класс для чтения Excel-файлов из Google Drive.
 */
export class ExcelReader {
  private readonly driveReader: DriveReader;

  /**
   * @param driveReader Экземпляр DriveReader с настроенной аутентификацией
   */
  public constructor(driveReader: DriveReader) {
    this.driveReader = driveReader;
  }

  /**
   * Загружает файл и возвращает объект книги Excel.
   * @param fileId ID файла в Google Drive
   */
  public async loadWorkbook(fileId: string): Promise<ExcelWorkbook> {
    const fileStream = await this.driveReader.downloadFile(fileId);
    const buffer = await this.streamToBuffer(fileStream);
    return new ExcelWorkbook(buffer);
  }

  private streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("error", (error) => reject(error));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }
}
