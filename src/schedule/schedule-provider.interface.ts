import type { GroupInformation, ScheduleWeek, ScheduleWeeks } from "./types";

export interface ScheduleProvider {
  getFullSchedule(group: GroupInformation): Promise<ScheduleWeeks>;
  getWeekSchedule(group: GroupInformation, weekNumber: number): Promise<ScheduleWeek>;
}