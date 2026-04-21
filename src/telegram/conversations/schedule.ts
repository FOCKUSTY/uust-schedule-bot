import { env } from "../../env";

import type { Conversation } from "@grammyjs/conversations";
import type { Context } from "../bot";

import { InlineKeyboard } from "grammy";

import { UserService } from "../../database/user.service";
import { Schedule, WeekCalculator } from "../../schedule";

import { DAY_NAMES_RU, resolveDayOffset, resolveQuickDate } from "../schedule";

import { CALLBACK_DATA } from "../constants/callback-data";

import {
  formatDay,
  formatWeek,
  getWeekendText,
} from "../utils/format-schedule";

import { sendOrEditMessage } from "../utils/send-or-edit";
import { configSelectionKeyboard, mainMenuKeyboard } from "../keyboards";

const userService = new UserService();
const weekCalculator = new WeekCalculator(env.START_DATE);

export const SCHEDULE_CONVERSATION = "schedule";

export const scheduleConversation = async (
  conversation: Conversation<Context, Context>,
  ctx: Context,
) => {
  const session = await conversation.external(({ session }) => session);
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    throw new Error("id is not defined.");
  }

  const configs = await userService.getActiveConfigs(telegramId);
  const defaultConfig = configs.find((config) => config.defaulted);

  if (configs.length === 0 || !defaultConfig) {
    return sendOrEditMessage(ctx, "Выберите группу", {
      keyboard: configSelectionKeyboard(configs),
      conversation,
    });
  }

  const {
    dayIndex,
    weekNumber: currentWeek,
    dayOffset,
  } = resolveQuickDate({
    qiuckDate: session.quickDate,
    weekNumber: weekCalculator.getCurrentWeek(),
    offsets: {
      dayOffset: session.currentDayOffset,
      weekOffset: session.currentWeekOffset,
    },
  });

  const dayName = DAY_NAMES_RU.at(dayIndex);
  if (!dayName) {
    return sendOrEditMessage(ctx, "Произошла ошибка, извините", {
      conversation,
    });
  }

  const currentGroup = defaultConfig;
  const schedule = new Schedule(currentGroup, currentWeek);
  await schedule.initializeCache();

  const week = await schedule.getWeekSchedule();
  const day = week.days[dayName];

  if (!day) {
    return sendOrEditMessage(ctx, "Произошла ошибка, извините", {
      conversation,
      keyboard: mainMenuKeyboard()
    });
  }

  const dayText =
    dayName === "Воскресенье"
      ? getWeekendText(dayName, currentWeek, weekCalculator)
      : formatDay(day, currentWeek, weekCalculator, currentGroup.group);

  const weekText = formatWeek(
    { days: week.days, weekNumber: currentWeek },
    weekCalculator,
    currentGroup.group,
  );

  const keyboard = new InlineKeyboard();

  if (session.watchType === "day") {
    keyboard
      .text("⬅️", CALLBACK_DATA.SCHEDULE_DAY_PREV)
      .text(`📅 ${dayName}`, CALLBACK_DATA.SCHEDULE_DAY_RESET)
      .text("➡️", CALLBACK_DATA.SCHEDULE_DAY_NEXT)
      .row();
    keyboard.text("🗓 На неделю", CALLBACK_DATA.SCHEDULE_SWITCH_TOWEEK).row();
  } else {
    keyboard
      .text("⬅️", CALLBACK_DATA.SCHEDULE_WEEK_PREV)
      .text(`📅 Неделя ${currentWeek}`)
      .text("➡️", CALLBACK_DATA.SCHEDULE_WEEK_NEXT)
      .row();
    keyboard.text("🗓 На день", CALLBACK_DATA.SCHEDULE_SWITCH_TODAY).row();
  }

  keyboard
    .text("🔄 Сменить группу", CALLBACK_DATA.SCHEDULE_SWITCH_GROUP)
    .text(currentGroup.group, CALLBACK_DATA.SCHEDULE_WEEK_RESET)
    .row();

  keyboard.text("Вывести все группы", "schedule:print:allgroups").row();

  const text = session.watchType === "day" ? dayText : weekText;

  await conversation.external(({ session }) => {
    if (
      session.quickDate !== "none" &&
      session.currentDayOffset !== dayOffset
    ) {
      session.currentDayOffset = dayOffset;
    }

    session.quickDate = "none";
  });

  await sendOrEditMessage(ctx, text, { keyboard, session, conversation });
};
