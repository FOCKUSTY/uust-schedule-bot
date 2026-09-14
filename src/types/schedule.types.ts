export type GroupInformation = {
  faculty: string;
  course: string;
  specialization: string;
  group: string;
  groupId: number;
};

export type Teacher = {
  name: string;
};

export type Pair = {
  title: string;
  type: string;
  teacher: Teacher;
  location: string;
};

export type DaySchedule = Record<number, Pair>;

export type WeekSchedule = Record<number, DaySchedule>;

export type WeeksSchedule = Record<string, WeekSchedule>;

export type WeekScheduleInfo = {
  groupId: number;
  weekNumber: number;
};

export type DayScheduleInfo = WeekScheduleInfo & {
  dayNumber: number;
};
