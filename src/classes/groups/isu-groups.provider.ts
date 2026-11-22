import type { GroupSo } from "@/types";
import type { CacheUseSettings } from "@/interfaces";

import * as cheerio from "cheerio";

import { MemoryCache } from "../cache";
import { UNKNOWN_FACULTY, UNKNOWN_SPECIALIZATION } from "@/constants";

const ISU_BASE_URL = "https://isu.uust.ru";
const ISU_SCHEDULE_PATH = "/module/schedule/schedule_2024_script.php";
const ISU_GROUPS_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * «РЭУ(ц)2225(2)» → специализация «РЭУ», флаг «ц», номер «2225», курс «2».
 * Если формат не совпадёт — сработает fallback (см. `parseGroupTitle`).
 */
const GROUP_TITLE_REGEX = /^([^(\d]+?)(?:\(([^)]+)\))?(\d+)(?:\((\d+)\))?$/;

export type IsuSearchResult = {
  id: number;
  name: string;
};

export type ParsedGroupTitle = {
  faculty: string;
  course: string;
  specialization: string;
  group: string;
};

export class IsuGroupsProvider {
  private readonly _url = ISU_BASE_URL;
  private readonly _memory = new MemoryCache("isu-groups");

  public constructor() {}

  // ==================== PRIMARY: SEARCH ====================

  /**
   * Прямой поиск групп по названию. Основной и самый надёжный метод.
   * Возвращает `{ id, name }[]` — как старый `ScheduleSearch.searchGroups`.
   */
  public async searchGroups(
    query: string,
    cacheSettings?: Partial<CacheUseSettings>,
  ): Promise<IsuSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    return this._memory.use(
      `SEARCH_${trimmed.toLowerCase()}`,
      () => this.fetchSearchGroups(trimmed),
      {
        timeToLiveMs: ISU_GROUPS_TTL_MS,
        ...cacheSettings,
      },
    );
  }

  /**
   * Удобный шорткат: возвращает id первой подходящей группы
   * (точное совпадение имени приоритетно).
   */
  public async findGroupIdByName(
    name: string,
    cacheSettings?: Partial<CacheUseSettings>,
  ): Promise<number | undefined> {
    const results = await this.searchGroups(name, cacheSettings);
    const exact = results.find((r) => r.name === name);
    return exact?.id ?? results[0]?.id;
  }

  /**
   * Собирает все доступные группы, перебирая широкие запросы по алфавиту
   * и цифрам. Медленно (десятки HTTP-запросов), кешируется на сутки.
   */
  public async getAllGroups(
    cacheSettings?: Partial<CacheUseSettings>,
  ): Promise<IsuSearchResult[]> {
    return this._memory.use("ALL_GROUPS", () => this.fetchAllGroups(), {
      timeToLiveMs: ISU_GROUPS_TTL_MS,
      ...cacheSettings,
    });
  }

  // ==================== APARKIT-COMPAT (best effort) ====================

  /**
   * Best-effort список факультетов.
   *
   * ⚠️ У ИСУ нет явного поля `faculty` в ответе `filter_group`, поэтому
   * по умолчанию все группы попадают в `UNKNOWN_FACULTY`. Если на странице
   * ИСУ есть faculty-дропдаун (`/class_schedule/`), его можно распарсить и
   * подмешать сюда. Пока метод оставлен для совместимости с `AparkitApi`.
   */
  public async getFaculties(
    cacheSettings?: Partial<CacheUseSettings>,
  ): Promise<string[]> {
    const groups = await this.getAllGroups(cacheSettings);
    const set = new Set<string>();
    for (const group of groups) {
      set.add(this.parseGroupTitle(group.name).faculty);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }

  public async getCourses(
    faculty: string,
    cacheSettings?: Partial<CacheUseSettings>,
  ): Promise<string[]> {
    const groups = await this.getAllGroups(cacheSettings);
    const set = new Set<string>();
    for (const group of groups) {
      const parsed = this.parseGroupTitle(group.name);
      if (parsed.faculty !== faculty) continue;
      set.add(parsed.course);
    }
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }

  public async getSpecializations(
    faculty: string,
    course: string,
    cacheSettings?: Partial<CacheUseSettings>,
  ): Promise<string[]> {
    const groups = await this.getAllGroups(cacheSettings);
    const set = new Set<string>();
    for (const group of groups) {
      const parsed = this.parseGroupTitle(group.name);
      if (parsed.faculty !== faculty) continue;
      if (parsed.course !== course) continue;
      set.add(parsed.specialization);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }

  public async getGroupsByFilter(
    faculty: string,
    course: string,
    specialization: string,
    cacheSettings?: Partial<CacheUseSettings>,
  ): Promise<GroupSo[]> {
    const groups = await this.getAllGroups(cacheSettings);
    return groups
      .filter((group) => {
        const parsed = this.parseGroupTitle(group.name);
        return (
          parsed.faculty === faculty &&
          parsed.course === course &&
          parsed.specialization === specialization
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
      .map((group) => this.toGroupSo(group));
  }

  // ==================== HELPERS ====================

  /**
   * Разбирает название группы в компоненты `faculty/course/specialization`.
   * Формат по умолчанию: `{SPECIALIZATION}({FLAG}){NUMBER}({COURSE})`.
   */
  public parseGroupTitle(title: string): ParsedGroupTitle {
    const match = title.match(GROUP_TITLE_REGEX);
    if (!match) {
      return {
        faculty: UNKNOWN_FACULTY,
        course: "0",
        specialization: UNKNOWN_SPECIALIZATION,
        group: title,
      };
    }

    const [, spec, , , course] = match;
    return {
      faculty: UNKNOWN_FACULTY,
      course: course ?? "0",
      specialization: spec?.trim() || UNKNOWN_SPECIALIZATION,
      group: title,
    };
  }

  // ==================== INTERNAL ====================

  private toGroupSo(result: IsuSearchResult): GroupSo {
    const parsed = this.parseGroupTitle(result.name);
    return {
      id: result.id,
      long_id: String(result.id),
      creation_dt: "",
      entity_type: "group",
      actualization_dt: "",
      uust_api_id: 0,
      title: result.name,
      faculty: parsed.faculty,
      course: parsed.course ? Number(parsed.course) : null,
      difference_level: null,
      uust_api_data: {},
    };
  }

  private async fetchSearchGroups(query: string): Promise<IsuSearchResult[]> {
    const html = await this.post("filter_group", {
      text_search_group: query.toLowerCase(),
      week: "1",
    });
    return this.parseSearchResult(html);
  }

  private async fetchAllGroups(): Promise<IsuSearchResult[]> {
    const probes = "абвгдежзийклмнопрстуфхцчшщэюя0123456789";
    const collected = new Map<number, IsuSearchResult>();

    for (const probe of probes) {
      try {
        const groups = await this.fetchSearchGroups(probe);
        for (const group of groups) {
          if (!collected.has(group.id)) {
            collected.set(group.id, group);
          }
        }
      } catch (error) {
        console.warn(
          `[IsuGroupsProvider] Failed to fetch groups by "${probe}":`,
          error,
        );
      }
    }

    return Array.from(collected.values());
  }

  private parseSearchResult(html: string): IsuSearchResult[] {
    const $ = cheerio.load(html);
    const result: IsuSearchResult[] = [];

    $("button.link-button.sear").each((_, el) => {
      const onclick = $(el).attr("onclick") || "";
      const match = onclick.match(/link_group\((\d+),\s*\d+\)/);
      if (!match) return;

      const id = parseInt(match[1], 10);
      const name = $(el).text().trim();
      if (!name) return;

      result.push({ id, name });
    });

    return result;
  }

  private async post(
    funct: string,
    extra: Record<string, string> = {},
  ): Promise<string> {
    const url = `${this._url}${ISU_SCHEDULE_PATH}`;
    const body = new URLSearchParams({ funct, ...extra });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (compatible; Node.js)",
        Referer: "https://isu.uust.ru/class_schedule/",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(
        `ISU request failed (${response.status} ${response.statusText})`,
      );
    }

    return response.text();
  }
}
