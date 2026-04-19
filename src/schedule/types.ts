import type { FileInfo, ExcelSheetInfo } from "./google";

export interface GroupInformation {
  course: string;
  specialization: string;
  group: string;
}

export interface ScheduleDay {
  dayName: string;
  pairs: Record<number, string | null>;
}

export interface ScheduleWeek {
  weekNumber: number;
  days: Record<string, ScheduleDay>;
}

export type ScheduleWeeks = Record<string, ScheduleWeek>;

export interface FormattedSchedule {
  groupName: string;
  weeks: ScheduleWeeks;
}

export interface CacheData {
  default: Record<
    string, // course
    Record<
      string, // specialization
      Record<
        string, // group
        {
          weeks: ScheduleWeeks;
          expiresAt: string; // ISO
        }
      >
    >
  >;
  other: Record<string, unknown>;
}

export type DateLike = Date | string | number;
