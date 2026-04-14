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

export interface GroupInformation {
  course: string;
  specialization: string;
  group: string;
}

export interface FileData {
  folderId: string;
  name: string;
  extension?: string;
}

export type CacheType = {
  [course: string]: {
    [specialization: string]: {
      [group: string]: {
        weeks: ScheduleWeeks,
        /** ISO date string */
        expiresAt: string;
      }
    }
  }
}