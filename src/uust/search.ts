import * as cheerio from 'cheerio';

type SearchResult = Array<{ id: number; name: string }>;

export class ScheduleSearch {
  private readonly baseUrl: string;

  public constructor(baseUrl: string = 'https://isu.uust.ru') {
    this.baseUrl = baseUrl;
  }

  /**
   * Универсальный метод поиска
   * @param type - 'group' | 'teacher' | 'class'
   * @param query - строка поиска
   * @param week - номер недели (по умолчанию 1)
   */
  private async search(
    type: 'group' | 'teacher' | 'class',
    query: string,
    week: number = 1
  ): Promise<SearchResult> {
    const functMap = {
      group: 'filter_group',
      teacher: 'filter_teacher',
      class: 'filter_class',
    };
    const paramName = `text_search_${type}`;

    const url = `${this.baseUrl}/module/schedule/schedule_2024_script.php`;
    const body = new URLSearchParams({
      funct: functMap[type],
      [paramName]: query.toLowerCase(),
      week: String(week),
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`Ошибка HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const result: SearchResult = [];

    $('button.link-button.sear').each((_, el) => {
      const onclick = $(el).attr('onclick') || '';
      const match = onclick.match(/link_(group|teacher|class)\((\d+),\s*\d+\)/);
      if (match) {
        const id = parseInt(match[2], 10);
        const name = $(el).text().trim();
        result.push({ id, name });
      }
    });

    return result;
  }

  /** Поиск групп по названию */
  async searchGroups(query: string): Promise<SearchResult> {
    return this.search('group', query);
  }

  /** Поиск преподавателей по ФИО */
  async searchTeachers(query: string): Promise<SearchResult> {
    return this.search('teacher', query);
  }

  /** Поиск аудиторий по номеру или корпусу */
  async searchClassrooms(query: string): Promise<SearchResult> {
    return this.search('class', query);
  }

  /** Утилита: найти первый точный или частичный ID по названию */
  async findGroupIdByName(groupName: string): Promise<number | null> {
    const results = await this.searchGroups(groupName);
    const exact = results.find((item) => item.name === groupName);
    return exact ? exact.id : (results.length > 0 ? results[0].id : null);
  }

  async findTeacherIdByName(teacherName: string): Promise<number | null> {
    const results = await this.searchTeachers(teacherName);
    const exact = results.find((item) => item.name === teacherName);
    return exact ? exact.id : (results.length > 0 ? results[0].id : null);
  }

  async findClassroomIdByName(classroomName: string): Promise<number | null> {
    const results = await this.searchClassrooms(classroomName);
    const exact = results.find((item) => item.name === classroomName);
    return exact ? exact.id : (results.length > 0 ? results[0].id : null);
  }
}