import { Conversation } from "@grammyjs/conversations";
import { Context } from "../bot";

import { UserService } from "../../database/user.service";
import { getCurrentWeek, Schedule } from "../../schedule";
import {
  DAY_NAMES_RU,
  getDayIndexForToday,
  resolveDayOffset,
} from "../schedule";
import { InlineKeyboard } from "grammy";
import {
  formatDay,
  formatWeek,
  getWeekendText,
} from "../utils/format-schedule";
import { sendOrEditMessage } from "../utils/send-or-edit";
import { configSelectionKeyboard } from "../keyboards";

const userService = new UserService();
export const SCHEDULE_CONVERSATION = "schedule";

export const scheduleConversation = async (
  conversation: Conversation<Context, Context>,
  interaction: Context,
) => {
  const session = await conversation.external(({ session }) => session);
  const telegramId = interaction.from?.id;
  if (!telegramId) {
    throw new Error("id is not defined.");
  }

  let currentDay: number | null = null;
  let currentWeek: number | null = null;
  let currentGroupIndex: number | null = null;

  const configs = await userService.getActiveConfigs(telegramId);
  const defaultConfig = configs
    .map((config, index) => ({ config, index }))
    .filter((data) => data.config.isDefault)[0];

  if (configs.length === 0 || !defaultConfig) {
    return sendOrEditMessage(interaction, "Выберите группу", {
      keyboard: configSelectionKeyboard(configs),
      conversation,
    });
  }

  currentGroupIndex = defaultConfig.index;

  const weekOffset = session.currentWeekOffset || 0;
  currentWeek = getCurrentWeek() + weekOffset;

  currentDay = resolveDayOffset(session.currentDayOffset);
  const dayName = DAY_NAMES_RU.at(currentDay);
  if (!dayName) {
    return sendOrEditMessage(interaction, "Произошла ошибка, извините", {
      conversation,
    });
  }

  const schedule = new Schedule(configs[currentGroupIndex], currentWeek);
  const week = await schedule.execute();
  const day = week[dayName];

  const dayText = (() => {
    if (dayName === "Воскресенье") {
      return getWeekendText(dayName, currentWeek);
    }

    return formatDay(day, currentWeek);
  })();

  const weekText = formatWeek({
    days: week,
    weekNumber: currentWeek,
  });

  const keyboard = (() => {
    const keyboard = new InlineKeyboard();

    if (session.watchType === "day") {
      keyboard
        .text("⬅️", "schedule:day:previous")
        .text(`📅 ${dayName}`, "schedule:day:reset")
        .text("➡️", "schedule:day:next")
        .row();
      keyboard.text("🗓 На неделю", "schedule:switch:toweek").row();
    } else {
      keyboard
        .text("⬅️", "schedule:week:previous")
        .text(`📅 Неделя ${currentWeek}`)
        .text("➡️", "schedule:week:next")
        .row();
      keyboard.text("🗓 На день", "schedule:switch:today").row();
    }

    keyboard
      .text("🔄 Сменить группу", "menu:switch_group")
      .text(`${configs[currentGroupIndex].group}`, "schedule:week:reset")
      .row();
    keyboard.text("Вывести все группы", "schedule:print:allgroups").row();

    return keyboard;
  })();

  const text = (() => {
    if (session.watchType === "day") {
      return dayText;
    }

    return weekText;
  })();

  await sendOrEditMessage(interaction, text, { keyboard, conversation });
};
