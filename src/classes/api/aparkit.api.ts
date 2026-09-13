import type { CurrentWeekSo, GroupLessonSo, GroupSo } from "@/types";
import { MemoryCache } from "../cache";
import { env } from "@/env";

const UNKNOWN_FACULTY = "Без факультета";
const UNKNOWN_SPECIALIZATION = "Прочее";

const INFO_TIME_TO_LIVE_MS = 24 * 60 * 60 * 1000;

export class AparkitApi {
  private readonly _url = "https://api.schedule-uust.arpakit.com";
  private readonly _memory: MemoryCache = new MemoryCache(false);

  public constructor() {}

  public async getCurrentDay() {
    const date = new Date();
    const day = date.getDay() === 0 ? 7 : date.getDay();
    return day;
  }

  public async getCurrentWeek() {
    const response = await this.request<CurrentWeekSo>(
      "/api/v1/get_current_week",
      undefined,
      60 * 60 * 1000,
    );
    return response.value;
  }

  public async getGroupLessons(groupId: number): Promise<GroupLessonSo[]> {
    return this.request("/api/v1/get_group_lessons", {
      filter_group_id: groupId,
    });
  }

  public getFaculty(group: GroupSo) {
    const faculty =
      group.faculty ?? group.uust_api_data?.faculty ?? UNKNOWN_FACULTY;
    return faculty.trim();
  }

  public getSpecialization(group: GroupSo) {
    const match = group.title.match(/^([А-ЯЁ]+)/u);
    return match ? match[1] : UNKNOWN_SPECIALIZATION;
  }

  public async getFaculties(): Promise<string[]> {
    return this._memory.use(
      "FACULTIES",
      async () => {
        const groups = await this.getAllGroups();
        const set = new Set<string>();
        for (const group of groups) {
          set.add(this.getFaculty(group));
        }

        const faculties = Array.from(set).sort((a, b) =>
          a.localeCompare(b, "ru"),
        );
        return faculties;
      },
      {
        timeToLiveMs: INFO_TIME_TO_LIVE_MS,
      },
    );
  }

  public async getCourses(faculty: string): Promise<string[]> {
    return this._memory.use(
      `COURSES_${faculty}`,
      async () => {
        const groups = await this.getAllGroups();
        const set = new Set<string>();

        for (const group of groups) {
          if (this.getFaculty(group) !== faculty) {
            continue;
          }

          if (group.course === null) {
            continue;
          }

          set.add(String(group.course));
        }

        return Array.from(set).sort((a, b) => Number(a) - Number(b));
      },
      {
        timeToLiveMs: INFO_TIME_TO_LIVE_MS,
      },
    );
  }

  public async getSpecializations(
    faculty: string,
    course: string,
  ): Promise<string[]> {
    return this._memory.use(
      `SPECIALIZATIONS_${faculty}_${course}`,
      async () => {
        const groups = await this.getAllGroups();
        const set = new Set<string>();

        for (const group of groups) {
          if (this.getFaculty(group) !== faculty) continue;
          if (String(group.course) !== course) continue;
          set.add(this.getSpecialization(group));
        }

        return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
      },
      {
        timeToLiveMs: INFO_TIME_TO_LIVE_MS,
      },
    );
  }

  public async getGroupsByFilter(
    faculty: string,
    course: string,
    specialization: string,
  ): Promise<GroupSo[]> {
    return this._memory.use(
      `GROUPS_FILTER_${faculty}_${course}_${specialization}`,
      async () => {
        const groups = await this.getAllGroups();

        return groups
          .filter(
            (g) =>
              this.getFaculty(g) === faculty &&
              String(g.course) === course &&
              this.getSpecialization(g) === specialization,
          )
          .sort((a, b) => a.title.localeCompare(b.title, "ru"));
      },
      {
        timeToLiveMs: INFO_TIME_TO_LIVE_MS,
      },
    );
  }

  public async getAllGroups() {
    const groups = await this.request<GroupSo[]>(
      "/api/v1/get_groups",
      undefined,
      INFO_TIME_TO_LIVE_MS,
    );
    return groups;
  }

  private async request<T>(
    path: string,
    parameters: Record<string, unknown> = {},
    timeToLiveMs?: number,
  ): Promise<T> {
    const url = new URL(path, this._url);
    for (const [key, value] of Object.entries(parameters)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    }

    return this._memory.use<T>(
      url.toString(),
      async () => {
        const headers = {
          Accept: "application/json",
          apikey: env.APARKIT_API_KEY,
        };

        const response = await fetch(url.toString(), { headers });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `Fetch failed (${response.status} ${response.statusText}): ${text}`,
          );
        }

        const json = await response.json();
        return json;
      },
      { timeToLiveMs },
    );
  }
}
