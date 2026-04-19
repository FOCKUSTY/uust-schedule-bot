import type { GroupInformation, ScheduleWeek, ScheduleWeeks } from "./types";

import { GoogleDriveService } from "./google-drive.service";
import { ScheduleFormatter } from "./formatter";

/**
 * Загружает и парсит расписание из Google Drive.
 */
export class ScheduleLoader {
  private readonly formatter: ScheduleFormatter;

  public constructor(
    private readonly driveService: GoogleDriveService,
    formatter?: ScheduleFormatter,
  ) {
    this.formatter = formatter ?? new ScheduleFormatter();
  }

  /**
   * Загружает полное расписание для группы (все недели) и возвращает структурированные данные.
   * @param group Информация о группе
   */
  public async loadFullSchedule(group: GroupInformation): Promise<ScheduleWeeks> {
    const workbook = await this.driveService.loadWorkbook(
      group.course,
      group.specialization,
    );

    const dimensions = workbook.getSheetDimensions(group.group);
    const rawData = workbook.getSheetDataByRange(group.group, {
      startRow: 1,
      startColumn: 1,
      endRow: dimensions.endRow + 1,
      endColumn: dimensions.endCol + 1,
    });

    const formatted = this.formatter.format(rawData);
    return formatted.weeks;
  }

  /**
   * Загружает расписание только для конкретной недели.
   * @param group Информация о группе
   * @param weekNumber Номер недели
   */
  public async loadWeekSchedule(
    group: GroupInformation,
    weekNumber: number,
  ): Promise<ScheduleWeek> {
    const weeks = await this.loadFullSchedule(group);
    const week = weeks[weekNumber];
    if (!week) {
      throw new Error(`Неделя ${weekNumber} не найдена в расписании`);
    }
    return week;
  }
}