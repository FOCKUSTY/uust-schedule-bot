// src/schedule/providers/aparkit-schedule.provider.ts

import { GroupLessonSO, GroupSO } from "../aparkit/types";
import { ScheduleProvider } from "../schedule-provider.interface";
import { GroupInformation, ScheduleWeek, ScheduleWeeks } from "../types";

export interface CurrentWeekSO {
  id: number;
  long_id: string;
  creation_dt: string;
  entity_type: string;
  actualization_dt: string;
  value: number; // ← номер недели
}

const API_BASE_URL = "https://api.schedule-uust.arpakit.com";

const WEEKDAY_NAMES: Record<number, string> = {
  1: "Понедельник",
  2: "Вторник",
  3: "Среда",
  4: "Четверг",
  5: "Пятница",
  6: "Суббота",
  7: "Воскресенье",
};

/** Плейсхолдер для групп без faculty */
const UNKNOWN_FACULTY = "Без факультета";
const UNKNOWN_SPECIALIZATION = "Прочее";

export class ScheduleApiProvider implements ScheduleProvider {
  private token: string | null;
  private cache: Map<string, ScheduleWeeks> = new Map();
  private allGroupsCache: GroupSO[] | null = null;

  private currentWeekCache: { value: number; fetchedAt: number } | null = null;
  private static readonly CURRENT_WEEK_TTL = 30 * 60 * 1000; // 30 минут

  constructor(token?: string) {
    this.token = token ?? null;
  }

  public async getCurrentWeek(skipCache = false): Promise<number> {
    if (
      !skipCache &&
      this.currentWeekCache &&
      Date.now() - this.currentWeekCache.fetchedAt <
        ScheduleApiProvider.CURRENT_WEEK_TTL
    ) {
      return this.currentWeekCache.value;
    }

    const data = await this.request<CurrentWeekSO>(
      "/api/v1/get_current_week",
    );

    if (!data || typeof data.value !== "number") {
      throw new Error("Invalid response from /api/v1/get_current_week");
    }

    this.currentWeekCache = {
      value: data.value,
      fetchedAt: Date.now(),
    };

    return data.value;
  }

  // ==================== ПУБЛИЧНЫЙ API ДЛЯ WIZARD ====================

  /** Список факультетов (уникальные `faculty`). */
  public async getFaculties(skipCache = false): Promise<string[]> {
    const groups = await this.getAllGroups(skipCache);
    const set = new Set<string>();

    for (const group of groups) {
      set.add(this.getFaculty(group));
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }

  /** Список курсов для факультета. */
  public async getCourses(
    faculty: string,
    skipCache = false,
  ): Promise<string[]> {
    const groups = await this.getAllGroups(skipCache);
    const set = new Set<string>();

    for (const group of groups) {
      if (this.getFaculty(group) !== faculty) continue;
      if (group.course != null) set.add(String(group.course));
    }

    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }

  /** Список специальностей для факультета и курса. */
  public async getSpecializations(
    faculty: string,
    course: string,
    skipCache = false,
  ): Promise<string[]> {
    const groups = await this.getAllGroups(skipCache);
    const set = new Set<string>();

    for (const group of groups) {
      if (this.getFaculty(group) !== faculty) continue;
      if (String(group.course) !== course) continue;
      set.add(this.getSpecialization(group));
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }

  /** Список групп по всем фильтрам. */
  public async getGroupsByFilters(
    faculty: string,
    course: string,
    specialization: string,
    skipCache = false,
  ): Promise<GroupSO[]> {
    const groups = await this.getAllGroups(skipCache);

    return groups
      .filter(
        (g) =>
          this.getFaculty(g) === faculty &&
          String(g.course) === course &&
          this.getSpecialization(g) === specialization,
      )
      .sort((a, b) => a.title.localeCompare(b.title, "ru"));
  }

  /** Все группы одним запросом (кэшируется в памяти). */
  public async getAllGroups(skipCache = false): Promise<GroupSO[]> {
    if (!skipCache && this.allGroupsCache) return this.allGroupsCache;

    const response = await this.request<GroupSO[] | { items: GroupSO[] }>(
      "/api/v1/get_groups",
    );

    const groups = Array.isArray(response) ? response : response.items ?? [];
    this.allGroupsCache = groups;
    return groups;
  }

  // ==================== ИЗВЛЕЧЕНИЕ ФАКУЛЬТЕТА / СПЕЦИАЛЬНОСТИ ====================

  private getFaculty(group: GroupSO): string {
    // Пробуем явное поле, потом uust_api_data
    const raw =
      group.faculty ??
      (group.uust_api_data?.faculty as string | undefined) ??
      null;

    return raw?.trim() || UNKNOWN_FACULTY;
  }

  /**
   * ⚠️ В API нет отдельного поля `specialization` —
   * выводим её из названия группы (префикс перед цифрами):
   *   "ИСП2325"      → "ИСП"
   *   "РЭУ(ц)2225(2)" → "РЭУ"
   *   "ПИ-101"        → "ПИ"
   *
   * Сначала пытаемся взять из `uust_api_data.specialization`,
   * если оно там появится.
   */
  private getSpecialization(group: GroupSO): string {
    const explicit =
      (group as any).specialization ??
      (group.uust_api_data?.specialization as string | undefined) ??
      (group.uust_api_data?.direction as string | undefined);

    if (typeof explicit === "string" && explicit.trim()) {
      return explicit.trim();
    }

    // Ведущие кириллические буквы (возможно, с "И" в начале — "ИСП")
    const match = group.title.match(/^([А-ЯЁ]+)/u);
    return match ? match[1] : UNKNOWN_SPECIALIZATION;
  }

  // ==================== ScheduleProvider ====================

  async getFullSchedule(group: GroupInformation): Promise<ScheduleWeeks> {
    const groupKey = this.buildGroupKey(group);
    const cached = this.cache.get(groupKey);
    if (cached) return cached;

    const groupId = await this.findGroupId(group);
    const lessons = await this.fetchGroupLessons(groupId);
    const schedule = this.buildScheduleWeeks(lessons);

    this.cache.set(groupKey, schedule);
    return schedule;
  }

  async getWeekSchedule(
    group: GroupInformation,
    weekNumber: number,
    skipCache: boolean,
  ): Promise<ScheduleWeek> {
    if (skipCache) {
      this.cache.delete(this.buildGroupKey(group));
    }

    const fullSchedule = await this.getFullSchedule(group);
    const week = fullSchedule[weekNumber.toString()];

    if (!week) {
      throw new Error(`Week ${weekNumber} not found for group ${group.group}`);
    }
    return week;
  }

  // ==================== ВНУТРЕННЕЕ ====================

  private buildGroupKey(group: GroupInformation): string {
    return `${group.course}|${group.specialization}|${group.group}`;
  }

  private async findGroupId(group: GroupInformation): Promise<number> {
    const response = await this.request<GroupSO[] | { items: GroupSO[] }>(
      "/api/v1/find_groups",
      { q: group.group },
    );

    const list = Array.isArray(response) ? response : response.items ?? [];
    if (list.length === 0) {
      throw new Error(`Group not found: ${group.group}`);
    }

    const exact = list.find(
      (g) =>
        g.title === group.group &&
        (group.specialization === "isu" || g.faculty === group.specialization),
    );

    return (exact ?? list[0]).id;
  }

  private async fetchGroupLessons(groupId: number): Promise<GroupLessonSO[]> {
    return this.request<GroupLessonSO[]>("/api/v1/get_group_lessons", {
      filter_group_id: groupId,
    });
  }

  private buildScheduleWeeks(lessons: GroupLessonSO[]): ScheduleWeeks {
    const weeks: ScheduleWeeks = {};

    for (const lesson of lessons) {
      const pairNumbers = this.extractPairNumbers(lesson);
      if (pairNumbers.length === 0) continue; // нечего добавлять

      const pairInfo = this.formatPair(lesson);

      for (const weekNum of lesson.weeks) {
        if (!weeks[weekNum]) {
          weeks[weekNum] = { weekNumber: weekNum, days: {} };
        }

        const dayKey = lesson.weekday.toString();
        if (!weeks[weekNum].days[dayKey]) {
          weeks[weekNum].days[dayKey] = {
            dayName: WEEKDAY_NAMES[lesson.weekday] ?? `День ${lesson.weekday}`,
            pairs: {},
          };
        }

        for (const pairNum of pairNumbers) {
          const existing = weeks[weekNum].days[dayKey].pairs[pairNum];

          // На всякий случай: если на одну пару пришло несколько уроков
          // (например, разные подгруппы) — конкатенируем
          weeks[weekNum].days[dayKey].pairs[pairNum] = existing
            ? `${existing}\n${pairInfo}`
            : pairInfo;
        }
      }
    }

    return weeks;
  }

  /**
   * Приоритет номеров пар:
   *  1. lesson.numbers (иногда заполнен)
   *  2. uust_api_data.schedule_time_num (основной источник)
   */
  private extractPairNumbers(lesson: GroupLessonSO): number[] {
    if (lesson.numbers.length > 0) return lesson.numbers;

    const fromApi = lesson.uust_api_data?.schedule_time_num;
    if (typeof fromApi === "number" && fromApi > 0) return [fromApi];

    return [];
  }

  private formatPair(lesson: GroupLessonSO): string {
    const parts: string[] = [lesson.title];

    // time_title уже в формате "15:50-17:20"
    const time =
      lesson.time_title ??
      this.formatTimeRange(lesson.time_start, lesson.time_end);
    if (time) parts.push(time);

    if (lesson.location) parts.push(lesson.location);

    const teacher = this.extractTeacherName(lesson);
    if (teacher) parts.push(teacher);

    return parts.join(" | ");
  }

  private formatTimeRange(
    start: string | null,
    end: string | null,
  ): string | null {
    if (!start || !end) return null;
    const s = start.length >= 5 ? start.slice(0, 5) : start;
    const e = end.length >= 5 ? end.slice(0, 5) : end;
    return `${s}-${e}`;
  }

  private extractTeacherName(lesson: GroupLessonSO): string | null {
    // 1) Из uust_api_data — там корректный вариант "Осипова А. В."
    const fromApi = lesson.uust_api_data?.teacher;
    if (typeof fromApi === "string" && fromApi.trim()) {
      return fromApi.trim();
    }

    // 2) Иначе собираем сами — shortname в API сломан
    const teacher = lesson.teacher;
    if (!teacher) return null;

    const nameInitial = teacher.name?.[0] ?? "";
    const patronymicInitial = teacher.patronymic?.[0] ?? "";
    const initials = [nameInitial, patronymicInitial]
      .filter(Boolean)
      .map((c) => `${c}.`)
      .join(" ");

    return initials ? `${teacher.surname} ${initials}` : teacher.surname;
  }

  private trimTime(value: string | null): string | null {
    if (!value) return null;
    return value.length >= 5 ? value.slice(0, 5) : value;
  }

  private async request<T>(
    path: string,
    params?: Record<string, any>,
  ): Promise<T> {
    const url = new URL(path, API_BASE_URL);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      apikey: "apikey65837863d18346a180aa1fac8e04f0661737856142404039",
    };

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed (${response.status}): ${errorBody}`);
    }

    return (await response.json()) as T;
  }
}