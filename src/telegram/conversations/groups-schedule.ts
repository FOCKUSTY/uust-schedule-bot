import { Conversation } from "@grammyjs/conversations";
import { Context } from "../bot";

import { UserService } from "../../database";
import { Schedule, WeekCalculator } from "../../schedule";
import { env } from "../../env";
import { sendOrEditMessage } from "../utils/send-or-edit";
import { configSelectionKeyboard, mainMenuKeyboard } from "../keyboards";
import { DAY_NAMES_RU, resolveQuickDate } from "../schedule";
import {
  formatDay,
  formatWeek,
  getWeekendText,
} from "../utils/format-schedule";
import { InlineKeyboard } from "grammy";
import { CALLBACK_DATA } from "../constants/callback-data";
import { SCHEDULE_CONVERSATION } from "./schedule";

const userService = new UserService();
const weekCalculator = new WeekCalculator(env.START_DATE);

export const GROUPS_SCHEDULE_CONVERSATION = "groups:schedule";

export const groupsScheduleConversation = async (
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
  const currentConfig =
    configs.find((config) => config.group === session.quickConfigGroup) ||
    defaultConfig;

  if (configs.length === 0 || !currentConfig) {
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

  const schedule = new Schedule(currentConfig, currentWeek);
  await schedule.initializeCache();

  const week = await schedule.getWeekSchedule();
  const day = week.days[dayName];

  if (!day) {
    return sendOrEditMessage(ctx, "Произошла ошибка, извините", {
      conversation,
      keyboard: mainMenuKeyboard(),
    });
  }

  const dayText =
    dayName === "Воскресенье"
      ? getWeekendText(dayName, currentWeek, weekCalculator)
      : formatDay(day, currentWeek, weekCalculator, currentConfig.group);

  const weekText = formatWeek(
    { days: week.days, weekNumber: currentWeek },
    weekCalculator,
    currentConfig.group,
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

  configs
    .filter((config) => config.id !== currentConfig.id)
    .forEach((config, index) => {
      keyboard.text(`🔎 ${config.group}`, `groups-schedule:${config.group}`);
      if (index % 2 === 0) {
        keyboard.row();
      }
    });
  keyboard.row();

  keyboard
    .text("Обычное расписание", CALLBACK_DATA.SCHEDULE_SWITCH_TODAY)
    .row();
  keyboard.text("В главное меню", CALLBACK_DATA.MENU_BACK).row();

  await conversation.external(({ session }) => {
    if (
      session.quickDate !== "none" &&
      session.currentDayOffset !== dayOffset
    ) {
      session.currentDayOffset = dayOffset;
    }

    session.quickConfigGroup = null;
    session.quickDate = "none";
  });

  const text = session.watchType === "day" ? dayText : weekText;
  await sendOrEditMessage(ctx, text, { keyboard, session, conversation });
};
