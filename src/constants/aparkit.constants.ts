import { MS_PER_HOUR } from "./time.constants";

export const APARKIT_BASE_URL = "https://api.schedule-uust.arpakit.com";

export const UNKNOWN_FACULTY = "Без факультета";
export const UNKNOWN_SPECIALIZATION = "Прочее";
export const UNKNOWN_TEACHER = "TEACHER SERVER ERROR";
export const UNKNOWN_LOCATION = "LOCATION SERVER ERROR";

export const APARKIT_INFO_TTL_MS = 24 * MS_PER_HOUR;
export const APARKIT_CURRENT_WEEK_TTL_MS = MS_PER_HOUR;
export const APARKIT_LESSONS_TTL_MS = 4 * MS_PER_HOUR;
export const APARKIT_WEEKS_SCHEDULE_TTL_MS = 12 * MS_PER_HOUR;

export const SPECIALIZATION_REGEX = /^([А-ЯЁ]+)/u;
