export interface ScheduleDay {
  dayName: string;
  pairs: Record<number, string | null>;
}

export interface ScheduleWeek {
  weekNumber: number;
  days: Record<string, ScheduleDay>;
}

export interface FormattedSchedule {
  groupName: string;
  weeks: Record<number, ScheduleWeek>;
}