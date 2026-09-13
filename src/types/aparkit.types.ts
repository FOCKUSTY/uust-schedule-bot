export type TeacherSo = {
  id: number;
  long_id: string;
  creation_dt: string;
  entity_type: string;
  actualization_dt: string;
  uust_api_id: number;
  name: string;
  surname: string;
  patronymic: string;
  fullname: string;
  shortname: string;
  posts: string[];
  post: string;
  units: string[];
  unit: string;
  difference_level: number | null;
  uust_api_data: Record<string, any>;
};

export type GroupSo = {
  id: number;
  long_id: string;
  creation_dt: string;
  entity_type: string;
  actualization_dt: string;
  uust_api_id: number;
  title: string;
  faculty: string | null;
  course: number | null;
  difference_level: number | null;
  uust_api_data: Record<string, any>;
};

export type GroupLessonSo = {
  id: number;
  long_id: string;
  creation_dt: string;
  entity_type: string;
  actualization_dt: string;
  uust_api_id: number;
  type: string;
  title: string;
  weeks: number[];
  weekday: number;
  comment: string | null;
  time_title: string | null;
  time_start: string | null; // формат "HH:MM:SS"
  time_end: string | null;
  numbers: number[];
  location: string | null;
  group_uust_api_id: number | null;
  teacher_uust_api_id: number | null;
  group: GroupSo;
  teacher: TeacherSo | null;
  uust_api_data: Record<string, any>;
};

export type CurrentWeekSo = {
  id: number;
  long_id: string;
  creation_dt: string;
  entity_type: string;
  actualization_dt: string;
  value: number;
};
