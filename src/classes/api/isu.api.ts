import type { GroupInformation, Pair, WeekSchedule } from "@/types";
import type { CacheUseSettings } from "@/interfaces";

import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";

import { MemoryCache } from "../cache";
import { UNKNOWN_LOCATION } from "@/constants";
import { BaseApi } from "../base";
import { writeFile } from "fs";

/** Базовый URL ИСУ */
const ISU_BASE_URL = "https://isu.uust.ru";
/** Путь к скрипту расписания */
const ISU_SCHEDULE_PATH = "/module/schedule/schedule_2024_script.php";
/** TTL для «редких» данных (id группы) */
const ISU_INFO_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** TTL для одной недели */
const ISU_WEEK_SCHEDULE_TTL_MS = 6 * 60 * 60 * 1000;
/** Сдвиг колонок: 0 — номер пары, 1 — время, 2+ — дни */
const HEADER_INDEX_OFFSET = 2;

/** Соответствие русских названий дней номерам (1 = Пн … 7 = Вс) */
const DAY_NAME_TO_NUMBER: Record<string, number> = {
  Понедельник: 1,
  Вторник: 2,
  Среда: 3,
  Четверг: 4,
  Пятница: 5,
  Суббота: 6,
  Воскресенье: 7,
};

export class IsuApi extends BaseApi {
  private readonly _url = ISU_BASE_URL;
  private readonly _memory: MemoryCache = new MemoryCache("isu-api");

  public constructor() {
    super();
  }

  /**
   * Возвращает id группы. Если в `group.groupId` уже есть — использует его,
   * иначе ищет по названию через `filter_group` (как старый `ScheduleSearch`).
   */
  public async getGroupId(
    group: GroupInformation,
    cacheSettings?: Partial<CacheUseSettings>,
  ): Promise<number | undefined> {
    if (group.groupId !== undefined) {
      return group.groupId;
    }

    return this._memory.use(
      `GROUP_ID_${group.group}`,
      () => this.searchGroupId(group.group),
      {
        timeToLiveMs: ISU_INFO_TTL_MS,
        ...cacheSettings,
      },
    );
  }

  /**
   * Возвращает расписание на конкретную неделю (0-based, как в новом коде).
   * Внутри к ИСУ обращаемся с `weekNumber + 1`, т.к. ИСУ ждёт 1-based.
   */
  public async getWeekSchedule(
    group: GroupInformation,
    weekNumber: number,
    cacheSettings?: Partial<CacheUseSettings>,
  ): Promise<WeekSchedule | null> {
    const groupId = await this.getGroupId(group, cacheSettings);
    if (groupId === undefined) {
      return null;
    }

    return this._memory.use(
      `WEEK_${groupId}_${weekNumber}`,
      () => this.fetchAndParseWeek(groupId, weekNumber),
      {
        timeToLiveMs: ISU_WEEK_SCHEDULE_TTL_MS,
        ...cacheSettings,
      },
    );
  }

  // ==================== SEARCH ====================

  private async searchGroupId(groupName: string): Promise<number | undefined> {
    const html = await this.post("filter_group", {
      text_search_group: groupName.toLowerCase(),
      week: "1",
    });

    const $ = cheerio.load(html);
    const results: Array<{ id: number; name: string }> = [];

    $("button.link-button.sear").each((_, el) => {
      const onclick = $(el).attr("onclick") || "";
      const match = onclick.match(/link_group\((\d+),\s*\d+\)/);
      if (match) {
        results.push({
          id: parseInt(match[1], 10),
          name: $(el).text().trim(),
        });
      }
    });

    const exact = results.find((r) => r.name === groupName);
    return exact?.id ?? results[0]?.id;
  }

  // ==================== FETCH ====================

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

  private async fetchAndParseWeek(
    groupId: number,
    weekNumber: number,
  ): Promise<WeekSchedule | null> {
    const html = await this.post("group", {
      group_id: String(groupId),
      week: String(weekNumber + 1),
      show_temp: "0",
    });

    const week = this.parseScheduleHtml(html);
    if (!week || Object.keys(week).length === 0) {
      return null;
    }

    return week;
  }

  // ==================== PARSE ====================

  private parseScheduleHtml(html: string): WeekSchedule | null {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const table =
      (document.querySelector("#schedule table") as HTMLTableElement | null) ??
      (document.querySelector("table") as HTMLTableElement | null);

    if (!table) {
      return null;
    }

    const dayNames = this.extractDayNames(table);
    const scriptData = this.extractScriptData(html);

    const tbody = table.querySelector("tbody");
    if (!tbody) return null;

    const week: WeekSchedule = {};

    tbody.querySelectorAll("tr").forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 3) return;

      const pairNumber = parseInt(cells[0].textContent?.trim() || "", 10);
      if (isNaN(pairNumber)) return;

      for (let i = HEADER_INDEX_OFFSET; i < cells.length; i++) {
        const dayIndex = i - HEADER_INDEX_OFFSET;
        if (dayIndex >= dayNames.length) break;

        const dayNumber = DAY_NAME_TO_NUMBER[dayNames[dayIndex]];
        if (!dayNumber) continue;

        const cell = cells[i];
        const cellId = cell.id;
        const contentHtml =
          cellId && scriptData[cellId] ? scriptData[cellId] : cell.innerHTML;

        const pairs = this.parseCellContent(contentHtml);
        for (const pair of pairs) {
          const day = (week[dayNumber] ??= {});
          (day[pairNumber] ??= []).push(pair);
        }
      }
    });

    return week;
  }

  private extractDayNames(table: HTMLTableElement): string[] {
    const headerRow = table.querySelector("thead tr");
    if (!headerRow) return [];

    const ths = headerRow.querySelectorAll("th");
    const names: string[] = [];

    for (let i = HEADER_INDEX_OFFSET; i < ths.length; i++) {
      const text = ths[i].textContent?.trim() || "";
      const match = text.match(/^([^\s(]+)/); // отсекаем "(01.09)"
      names.push(match ? match[1] : "");
    }

    return names;
  }

  /** Достаёт HTML, вставленный через `$('#id').append('...')`. */
  private extractScriptData(html: string): Record<string, string> {
    const result: Record<string, string> = {};
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;

    let scriptMatch: RegExpExecArray | null;
    while ((scriptMatch = scriptRegex.exec(html)) !== null) {
      const content = scriptMatch[1];

      // Backreference на кавычку: \1 и \3 — открывающие, \1 / \3 — закрывающие.
      // `[\s\S]*?` — не жадный, чтобы захватить всё до первой `')` / `")`.
      // Внутри HTML-строки кавычек ровно того типа, что снаружи, нет,
      // поэтому это безопасно.
      const appendRegex =
        /\$\((['"])(#[^'"]+)\1\)\.append\((['"])([\s\S]*?)\3\)/g;

      let appendMatch: RegExpExecArray | null;
      while ((appendMatch = appendRegex.exec(content)) !== null) {
        const id = appendMatch[2].replace("#", "");
        const appended = appendMatch[4];
        // Конкатенируем: у одной ячейки может быть несколько append-ов
        result[id] = (result[id] ?? "") + appended;
      }
    }

    return result;
  }

  private parseCellContent(htmlContent: string): Pair[] {
    if (!htmlContent.trim()) return [];

    const dom = new JSDOM(`<div id="__root__">${htmlContent}</div>`);
    const doc = dom.window.document;
    const root = doc.getElementById("__root__");
    if (!root) return [];

    const children = Array.from(root.children);
    const nodes: Element[] =
      children.length > 0 && children.every((c) => c.tagName === "DIV")
        ? children
        : [root];

    return nodes
      .map((node) => this.extractPairFromElement(node))
      .filter((pair): pair is Pair => pair !== null);
  }

  private extractPairFromElement(el: Element): Pair | null {
    const buttons = el.querySelectorAll("button");
    let teacherName: string | undefined;
    let classroomName: string | undefined;

    buttons.forEach((btn) => {
      let text = btn.textContent?.trim() || "";

      if (text.startsWith("-")) {
        text = text.replace(/^-\s*/, "");
      }

      if (
        text.includes(" - ") ||
        text.includes("ул.") ||
        text.includes("корпус") ||
        text === "Уточняется"
      ) {
        classroomName = text;
      } else {
        teacherName = text;
      }
    });

    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("button").forEach((btn) => btn.remove());

    let text = (clone.textContent || "").replace(/\s+/g, " ").trim();

    let subgroup: string | undefined;
    const subgroupMatch = text.match(/(\d+)\s*п\/п/);
    if (subgroupMatch) {
      subgroup = `${subgroupMatch[1]} п/п`;
      text = text.replace(subgroupMatch[0], "").trim();
    }

    const title = text;

    if (!title && !teacherName && !classroomName && !subgroup) {
      return null;
    }

    return {
      title,
      type: "",
      location: classroomName ?? UNKNOWN_LOCATION,
      teacher: { name: teacherName },
      subgroup,
    };
  }
}
