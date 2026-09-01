import type { FetchParams, ScheduleData } from './types';
import { ScheduleParser } from './parser';

/** Базовый URL по умолчанию */
const DEFAULT_BASE_URL = 'https://isu.uust.ru';

/** Путь к скрипту расписания */
const SCHEDULE_SCRIPT_PATH = '/module/schedule/schedule_2024_script.php';

export class ScheduleFetcher {
  private readonly baseUrl: string;
  private readonly parser: ScheduleParser;

  /**
   * @param baseUrl – базовый адрес сервера (можно переопределить)
   */
  public constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
    this.parser = new ScheduleParser();
  }

  /**
   * Загружает расписание по заданным параметрам и возвращает структурированные данные.
   */
  public async fetch(params: FetchParams): Promise<ScheduleData> {
    const url = this.buildUrl();
    const formData = this.buildFormData(params);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; Node.js)',
        Referer: 'https://isu.uust.ru/class_schedule/',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    return this.parser.parse(html);
  }

  private buildUrl(): string {
    return `${this.baseUrl}${SCHEDULE_SCRIPT_PATH}`;
  }

  private buildFormData(params: FetchParams): URLSearchParams {
    const {
      groupId,
      week,
      funct = 'group',
      teacherId,
      roomId,
      showTemp = 0,
    } = params;

    const form = new URLSearchParams();
    form.append('funct', funct);
    form.append('week', String(week));
    form.append('show_temp', String(showTemp));

    if (funct === 'group' && groupId) {
      form.append('group_id', String(groupId));
    } else if (funct === 'teacher_week_select' && teacherId) {
      form.append('isu_person_id', String(teacherId));
      form.append('head_isu_id', '-1');
    } else if (funct === 'class_week_select' && roomId) {
      form.append('room_id', String(roomId));
    } else {
      throw new Error(`Недостаточно параметров для funct=${funct}`);
    }

    return form;
  }
}