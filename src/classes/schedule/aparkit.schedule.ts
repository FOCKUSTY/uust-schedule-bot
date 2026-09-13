import {
  DaySchedule,
  DayScheduleInfo,
  Pair,
  WeekScheduleInfo,
  WeeksSchedule,
} from "@/types";
import { AparkitApi } from "../api";
import { MemoryCache } from "../cache";

const WEEKDAY_NAMES: Record<number, string> = {
  1: "Понедельник",
  2: "Вторник",
  3: "Среда",
  4: "Четверг",
  5: "Пятница",
  6: "Суббота",
  7: "Воскресенье",
};

export const LESSON_NUMBERS: Record<string, number> = {
  "08:00-09:30": 1,
  "09:40-11:10": 2,
  "12:00-13:30": 3,
  "13:40-15:10": 4,
  "15:50-17:20": 5,
  "17:30-19:00": 6,
  "19:10-20:40": 7,
};

export class AparkitSchedule {
  private readonly _memory: MemoryCache = new MemoryCache();
  public readonly api: AparkitApi = new AparkitApi();

  public constructor() {}

  public async getDaySchedule({
    dayNumber,
    ...weekInfo
  }: DayScheduleInfo): Promise<DaySchedule | null> {
    if (dayNumber === 7) {
      return null;
    }

    const week = await this.getWeekSchedule(weekInfo);
    const day = week[dayNumber];
    return day;
  }

  public async getWeekSchedule({ groupId, weekNumber }: WeekScheduleInfo) {
    const weeks = await this.getWeeksSchedule(groupId);
    const week = weeks[weekNumber];
    return week;
  }

  public async getWeeksSchedule(groupId: number): Promise<WeeksSchedule> {
    return this._memory.use(
      `WEEKS_${groupId}`,
      async () => this.getRawWeeksSchedule(groupId),
      {
        timeToLiveMs: 12 * 60 * 60 * 1000,
      },
    );
  }

  private async getRawWeeksSchedule(groupId: number) {
    const lessons = await this.api.getGroupLessons(groupId);

    const weeks: WeeksSchedule = {};
    for (const lesson of lessons) {
      const teacherName = lesson.teacher?.fullname || "TEACHER SERVER ERROR";
      const pair: Pair = {
        title: lesson.title,
        location: lesson.location ?? "LOCATION SERVER ERROR",
        teacher: {
          name: teacherName,
        },
      };

      for (const lessonWeek of lesson.weeks) {
        weeks[lessonWeek] = {
          ...(weeks?.[lessonWeek] ?? {}),
          [lesson.weekday]: {
            ...(weeks?.[lessonWeek]?.[lesson.weekday] ?? {}),
            [LESSON_NUMBERS[lesson.time_title!]]: pair,
          },
        };
      }
    }

    return weeks;
  }
}
