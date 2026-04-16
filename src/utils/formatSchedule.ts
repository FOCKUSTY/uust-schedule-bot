import type { ScheduleDay, ScheduleWeek } from '../schedule/types';

const DAY_NAMES_RU = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export function formatDay(day: ScheduleDay, weekNumber: number): string {
  let text = `📅 ${day.dayName} (неделя ${weekNumber})\n`;
  const pairs = day.pairs;
  const pairKeys = Object.keys(pairs).map(Number).sort((a,b) => a - b);
  if (pairKeys.length === 0) {
    text += 'Пар нет';
    return text;
  }
  for (const num of pairKeys) {
    const pairInfo = pairs[num] || '—';
    text += `${num}. ${pairInfo}\n`;
  }
  return text;
}

export function formatWeek(week: ScheduleWeek, weekNumber: number): string {
  let text = `📆 Расписание на неделю ${weekNumber}\n\n`;
  for (const dayName of DAY_NAMES_RU) {
    const day = week.days[dayName];
    if (day) {
      text += formatDay(day, weekNumber) + '\n\n';
    }
  }
  return text;
}