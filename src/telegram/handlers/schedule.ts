// src/telegram/handlers/schedule.ts
import { Context } from '../bot';
import { ScheduleService } from '../../services/schedule.service';
import { UserService } from '../../services/user.service';
import { formatDay, formatWeek } from '../../utils/formatSchedule';
import { getCurrentWeek } from '../../schedule/utils';
import { InlineKeyboard } from 'grammy';
import { sendOrEditMessage } from '../utils/messageHelper';

const scheduleService = new ScheduleService();
const userService = new UserService();

const DAY_NAMES_RU = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

// Приведение дня недели (0 = понедельник)
function getDayIndexForToday(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

function getDayIndexForTomorrow(): number {
  return (getDayIndexForToday() + 1) % 7;
}

export async function handleToday(ctx: Context) {
  const telegramId = ctx.from!.id;
  const config = await userService.getActiveConfig(`${telegramId}`);
  if (!config) {
    await ctx.reply('Сначала настройте группу через /start');
    return;
  }

  const weekOffset = ctx.session.currentWeekOffset || 0;
  const week = getCurrentWeek() + weekOffset;
  const schedule = await scheduleService.getScheduleForGroup(config, week);
  if (!schedule) {
    await ctx.reply('Не удалось загрузить расписание. Попробуйте позже.');
    return;
  }

  const dayIndex = getDayIndexForToday();
  const dayName = DAY_NAMES_RU[dayIndex];
  const daySchedule = schedule[dayName];
  const text = daySchedule ? formatDay(daySchedule, week) : `На сегодня (${dayName}) пар нет.`;

  await ctx.reply(text, { parse_mode: 'HTML' });
}

export async function handleTomorrow(ctx: Context) {
  const telegramId = ctx.from!.id;
  const config = await userService.getActiveConfig(`${telegramId}`);
  if (!config) {
    await ctx.reply('Сначала настройте группу через /start');
    return;
  }

  const weekOffset = ctx.session.currentWeekOffset || 0;
  const week = getCurrentWeek() + weekOffset;
  const schedule = await scheduleService.getScheduleForGroup(config, week);
  if (!schedule) {
    await ctx.reply('Не удалось загрузить расписание. Попробуйте позже.');
    return;
  }

  const dayIndex = getDayIndexForTomorrow();
  const dayName = DAY_NAMES_RU[dayIndex];
  const daySchedule = schedule[dayName];
  const text = daySchedule ? formatDay(daySchedule, week) : `На завтра (${dayName}) пар нет.`;

  await ctx.reply(text, { parse_mode: 'HTML' });
}

export async function handleWeek(ctx: Context) {
  const telegramId = ctx.from!.id;
  const config = await userService.getActiveConfig(`${telegramId}`);
  if (!config) {
    await ctx.reply('Сначала настройте группу через /start');
    return;
  }

  const weekOffset = ctx.session.currentWeekOffset || 0;
  const week = getCurrentWeek() + weekOffset;

  const fullWeeks = await scheduleService.getFullWeeks(config);
  if (!fullWeeks) {
    await ctx.reply('Не удалось загрузить расписание. Попробуйте позже.');
    return;
  }

  const weekSchedule = fullWeeks[week];
  if (!weekSchedule) {
    await ctx.reply(`Расписание на неделю ${week} не найдено.`);
    return;
  }

  const text = formatWeek(weekSchedule, week);
  const keyboard = new InlineKeyboard()
    .text('⬅️ Пред. неделя', 'schedule:prev_week')
    .text('➡️ След. неделя', 'schedule:next_week')
    .row()
    .text('🔙 В меню', 'menu:back');

  await sendOrEditMessage(ctx, text, keyboard);
}

export async function handlePrevWeek(ctx: Context) {
  ctx.session.currentWeekOffset = (ctx.session.currentWeekOffset || 0) - 1;
  await ctx.answerCallbackQuery();
  await handleWeek(ctx);
}

export async function handleNextWeek(ctx: Context) {
  ctx.session.currentWeekOffset = (ctx.session.currentWeekOffset || 0) + 1;
  await ctx.answerCallbackQuery();
  await handleWeek(ctx);
}

export async function scheduleCallbackHandler(ctx: Context) {
  const data = ctx.callbackQuery?.data;
  switch (data) {
    case 'schedule:prev_week':
      await handlePrevWeek(ctx);
      break;
    case 'schedule:next_week':
      await handleNextWeek(ctx);
      break;
    default:
      await ctx.answerCallbackQuery('Неизвестное действие');
  }
}