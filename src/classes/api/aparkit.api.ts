import type {
  CurrentWeekSo,
  GroupInformation,
  GroupLessonSo,
  GroupSo,
} from "@/types";
import { MemoryCache } from "../cache";
import { env } from "@/env";
import { DateCalculator } from "@/telegram/utils/date-calculator";
import {
  APARKIT_BASE_URL,
  APARKIT_INFO_TTL_MS,
  SPECIALIZATION_REGEX,
  UNKNOWN_FACULTY,
  UNKNOWN_SPECIALIZATION,
} from "@/constants";

export class AparkitApi {
  private readonly _url = APARKIT_BASE_URL;
  private readonly _memory: MemoryCache = new MemoryCache("aparkit-api");

  public constructor() {}

  public async getCurrentDay() {
    const date = new Date();
    const day = date.getDay() === 0 ? 7 : date.getDay();
    return day;
  }

  public async getCurrentWeek() {
    return new DateCalculator().getCurrentWeek();
    // const response = await this.request<CurrentWeekSo>(
    //   "/api/v1/get_current_week",
    //   undefined,
    //   APARKIT_CURRENT_WEEK_TTL_MS,
    // );
    // return response.value;
  }

  public async getGroupId(
    group: GroupInformation,
  ): Promise<number | undefined> {
    const groups = await this.getAllGroups();
    const groupSo = groups.find((groupSo) => groupSo.title === group.group);
    return groupSo?.id;
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
    const match = group.title.match(SPECIALIZATION_REGEX);
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
        timeToLiveMs: APARKIT_INFO_TTL_MS,
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
        timeToLiveMs: APARKIT_INFO_TTL_MS,
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
        timeToLiveMs: APARKIT_INFO_TTL_MS,
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
        timeToLiveMs: APARKIT_INFO_TTL_MS,
      },
    );
  }

  public async getAllGroups() {
    const groups = await this.request<GroupSo[]>(
      "/api/v1/get_groups",
      undefined,
      APARKIT_INFO_TTL_MS,
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
