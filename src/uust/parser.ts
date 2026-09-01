import type { ScheduleData, DaySchedule, ScheduleItem } from './types';
import { JSDOM } from 'jsdom';

const HEADER_INDEX_OFFSET = 2;

export class ScheduleParser {
  /**
   * Основной метод: принимает HTML и возвращает структуру расписания.
   */
  public parse(html: string): ScheduleData {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const table = this.findTable(document);
    const groupAndWeek = this.extractGroupAndWeek(document);
    const dayHeaders = this.extractDayHeaders(table);
    const timeMap = this.extractTimeMap(table);
    const scriptData = this.extractScriptData(html);

    const schedule = this.buildSchedule(table, dayHeaders, timeMap, scriptData);

    return {
      group: groupAndWeek.group,
      week: groupAndWeek.week,
      schedule,
    };
  }

  /** Находит таблицу расписания (сначала с id="schedule", потом любую) */
  private findTable(document: Document): HTMLTableElement {
    let table = document.querySelector('#schedule table') as HTMLTableElement;
    if (!table) {
      table = document.querySelector('table') as HTMLTableElement;
    }
    if (!table) {
      throw new Error('Таблица расписания не найдена');
    }
    return table;
  }

  /** Извлекает группу и номер недели из элемента #info label */
  private extractGroupAndWeek(document: Document): { group: string; week: number } {
    const label = document.querySelector('#info label');
    let group = '';
    let week = 0;

    if (label) {
      const text = label.textContent || '';
      const groupMatch = text.match(/Группа\s+([^\s]+)/);
      const weekMatch = text.match(/Неделя\s+(\d+)/);
      if (groupMatch) group = groupMatch[1];
      if (weekMatch) week = parseInt(weekMatch[1], 10);
    }

    return { group, week };
  }

  /** Извлекает названия дней из заголовков (начиная с третьего столбца) */
  private extractDayHeaders(table: HTMLTableElement): string[] {
    const thead = table.querySelector('thead');
    if (!thead) throw new Error('Отсутствует <thead>');
    const headerRow = thead.querySelector('tr');
    if (!headerRow) throw new Error('Отсутствует строка заголовков');

    const ths = headerRow.querySelectorAll('th');
    const dayNames: string[] = [];

    for (let i = HEADER_INDEX_OFFSET; i < ths.length; i++) {
      const th = ths[i];
      const text = th.textContent?.trim() || '';
      const match = text.match(/^([^\s(]+)/);
      const dayName = match ? match[1] : `day${i - HEADER_INDEX_OFFSET + 1}`;
      dayNames.push(dayName);
    }

    return dayNames;
  }

  /** Сопоставляет номер пары со временем из первого столбца времени */
  private extractTimeMap(table: HTMLTableElement): Record<number, string> {
    const timeMap: Record<number, string> = {};
    const tbody = table.querySelector('tbody');
    if (!tbody) throw new Error('Отсутствует <tbody>');

    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 2) return;

      const pairNumberText = cells[0].textContent?.trim() || '';
      const pairNumber = parseInt(pairNumberText, 10);
      const timeText = cells[1].textContent?.trim() || '';

      if (!isNaN(pairNumber)) {
        timeMap[pairNumber] = timeText;
      }
    });

    return timeMap;
  }

  /** Извлекает HTML-содержимое, которое было вставлено через скрипты вида $('#id').append('...') */
  private extractScriptData(html: string): Record<string, string> {
    const result: Record<string, string> = {};
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let scriptMatch: RegExpExecArray | null;

    while ((scriptMatch = scriptRegex.exec(html)) !== null) {
      const scriptContent = scriptMatch[1];
      const appendRegex = /\$\(['"](#[^'"]+)['"]\)\.append\(['"]([^'"]+)['"]\)/g;
      let appendMatch: RegExpExecArray | null;

      while ((appendMatch = appendRegex.exec(scriptContent)) !== null) {
        const id = appendMatch[1].replace('#', '');
        const content = appendMatch[2];
        result[id] = content;
      }
    }

    return result;
  }

  /** Строит итоговое расписание, заполняя ячейки таблицы */
  private buildSchedule(
    table: HTMLTableElement,
    dayHeaders: string[],
    timeMap: Record<number, string>,
    scriptData: Record<string, string>,
  ): DaySchedule {
    const schedule: DaySchedule = {};
    dayHeaders.forEach((day) => {
      schedule[day] = [];
    });

    const tbody = table.querySelector('tbody');
    if (!tbody) return schedule;

    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 3) return;

      const timeCell = cells[1];
      const time = timeCell.textContent?.trim() || '';

      for (let i = HEADER_INDEX_OFFSET; i < cells.length; i++) {
        const dayIndex = i - HEADER_INDEX_OFFSET;
        if (dayIndex >= dayHeaders.length) break;

        const cell = cells[i];
        const dayKey = dayHeaders[dayIndex];
        const cellId = cell.id || '';

        let contentHtml = '';
        if (cellId && scriptData[cellId]) {
          contentHtml = scriptData[cellId];
        } else {
          contentHtml = cell.innerHTML;
        }

        const item = this.parseCellContent(contentHtml, time);
        schedule[dayKey].push(item);
      }
    });

    return schedule;
  }

  /**
   * Разбирает HTML-содержимое ячейки и извлекает предмет, преподавателя, аудиторию.
   */
  private parseCellContent(htmlContent: string, time: string): ScheduleItem {
    const item: ScheduleItem = {
      time,
      subject: null,
      teacher: null,
      classroom: null,
    };

    if (!htmlContent.trim()) {
      return item;
    }

    const dom = new JSDOM(htmlContent);
    const doc = dom.window.document;

    const buttons = doc.querySelectorAll('button');
    let teacherText: string | null = null;
    let classroomText: string | null = null;

    buttons.forEach((btn) => {
      const text = btn.textContent?.trim() || '';
      if (text.includes(' - ') || text.includes('ул.') || text.includes('корпус')) {
        classroomText = text;
      } else {
        teacherText = text;
      }
    });

    const clone = doc.body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('button').forEach((btn) => btn.remove());
    let subjectText = clone.textContent?.trim() || '';
    subjectText = subjectText.replace(/\s+/g, ' ').trim();

    if (subjectText) item.subject = subjectText;
    if (teacherText) item.teacher = teacherText;
    if (classroomText) item.classroom = classroomText;

    return item;
  }
}