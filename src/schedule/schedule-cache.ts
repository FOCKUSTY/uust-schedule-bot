import type { CacheData, GroupInformation, ScheduleWeeks } from "./types";

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

import { CACHE_FILE_NAME, TWO_HOURS_MS } from "./constants";

/**
 * Сервис для асинхронного кэширования расписания в файл.
 */
export class ScheduleCache {
  private readonly filePath: string;
  private data: CacheData;

  /**
   * @param rootDir Корневая директория проекта (обычно process.cwd())
   */
  public constructor(rootDir: string) {
    this.filePath = join(rootDir, CACHE_FILE_NAME);
    this.data = { default: {}, other: {} };
  }

  /**
   * Загружает данные кэша из файла (если существует).
   */
  public async load(): Promise<void> {
    try {
      const content = await readFile(this.filePath, "utf-8");
      this.data = JSON.parse(content);
    } catch {
      // Файл отсутствует или повреждён – оставляем пустую структуру
    }
  }

  /**
   * Сохраняет текущее состояние кэша в файл.
   */
  public async save(): Promise<void> {
    try {
      await writeFile(
        this.filePath,
        JSON.stringify(this.data, null, 2),
        "utf-8",
      );
    } catch (error) {
      console.error("Failed to write schedule cache:", error);
    }
  }

  /**
   * Возвращает закэшированные недели для группы, если они не просрочены.
   * @param group Идентификатор группы
   */
  public getWeeks(group: GroupInformation): ScheduleWeeks | null {
    const groupData = this.data.default?.[group.course]?.[group.specialization]?.[group.group];
    if (!groupData) {
      return null;
    }

    const now = Date.now();
    const expiresAt = new Date(groupData.expiresAt).getTime();
    if (now >= expiresAt) {
      return null;
    }

    return groupData.weeks;
  }

  /**
   * Сохраняет недели расписания для группы с указанным TTL.
   * @param group Идентификатор группы
   * @param weeks Данные недель
   * @param ttl Время жизни в миллисекундах (по умолчанию 2 часа)
   */
  public setWeeks(
    group: GroupInformation,
    weeks: ScheduleWeeks,
    ttl: number = TWO_HOURS_MS,
  ): void {
    const expiresAt = new Date(Date.now() + ttl).toISOString();

    this.data.default[group.course] ??= {};
    this.data.default[group.course][group.specialization] ??= {};
    this.data.default[group.course][group.specialization][group.group] = {
      weeks,
      expiresAt,
    };
  }

  /**
   * Возвращает произвольные данные из секции `other`.
   * @param key Ключ
   */
  public getOther<T = unknown>(key: string): T | undefined {
    return this.data.other[key] as T | undefined;
  }

  /**
   * Сохраняет произвольные данные в секцию `other`.
   * @param key Ключ
   * @param value Значение
   */
  public setOther<T>(key: string, value: T): void {
    this.data.other[key] = value;
  }
}