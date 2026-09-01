export interface ScheduleItem {
  time: string;
  subject: string | null;
  teacher: string | null;
  classroom: string | null;
}

export interface DaySchedule {
  [day: string]: ScheduleItem[];
}

export interface ScheduleData {
  group: string;
  week: number;
  schedule: DaySchedule;
}

export interface FetchParams {
  groupId?: number;
  week: number;
  funct?: 'group' | 'teacher_week_select' | 'class_week_select';
  teacherId?: number;
  roomId?: number;
  showTemp?: number;
  baseUrl?: string;
}