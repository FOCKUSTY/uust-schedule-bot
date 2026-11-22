import type {
  DaySchedule,
  DayScheduleInfo,
  GroupInformation,
  WeekSchedule,
  WeekScheduleInfo,
  WeeksSchedule,
} from "@/types";

export abstract class BaseSchedule {
  public abstract getDaySchedule(
    info: DayScheduleInfo,
  ): Promise<DaySchedule | null>;
  public abstract getWeekSchedule(
    info: WeekScheduleInfo,
  ): Promise<WeekSchedule | null>;
  public abstract getWeeksSchedule(
    group: GroupInformation,
  ): Promise<WeeksSchedule>;
}
