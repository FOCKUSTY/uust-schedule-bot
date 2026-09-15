import type { Conversation } from "@/interfaces";
import type { Context, MyConversation } from "@/types";

import { InlineKeyboard } from "grammy";

import { AparkitSchedule } from "@/classes";
import { UserService } from "@/database";
import { QUICK_DATE, WATCH_TYPE, WEEKDAY_NAMES, WEEKEND } from "@/constants";
import { CALLBACK_DATA } from "../callback-data";
import { configSelectionKeyboard } from "../keyboards";
import {
  ScheduleResolver,
  getDayText,
  getNoDataText,
  getWeekText,
  getWeekendText,
  sendOrEditMessage,
} from "../utils";

export class GroupsScheduleConversation implements Conversation {
  private readonly _schedule: AparkitSchedule = new AparkitSchedule();
  private readonly _user_service: UserService = new UserService();

  public constructor() {}

  public async execute(
    conversation: MyConversation,
    context: Context,
  ): Promise<void> {
    const session = await conversation.external(({ session }) => session);
    const telegramId = context.from?.id;
    if (!telegramId) {
      throw new Error("id is not defined.");
    }

    if (session.last.conversation === GroupsScheduleConversation.name) {
      session.quickConfigGroup =
        session.quickConfigGroup || session.last.quickConfigGroup;
    }

    const configs = await this._user_service.getActiveConfigs(telegramId);
    const defaultConfig = configs.find((config) => config.defaulted);
    const currentConfig =
      configs.find((config) => config.group === session.quickConfigGroup) ||
      defaultConfig;

    if (configs.length === 0 || !currentConfig) {
      return sendOrEditMessage(context, "Выберите группу", {
        keyboard: configSelectionKeyboard(configs),
        conversation,
      });
    }

    const currentDayNumber = await this._schedule.api.getCurrentDay();
    const currentWeekNumber = await this._schedule.api.getCurrentWeek();
    const { dayNumber, dayOffset, weekNumber } =
      ScheduleResolver.resolveQuickDate({
        quickDate: session.quickDate,
        dayNumber: currentDayNumber,
        weekNumber: currentWeekNumber,
        offsets: {
          weekOffset: session.currentWeekOffset,
          dayOffset: session.currentDayOffset,
        },
      });

    const week = await this._schedule.getWeekSchedule({
      groupId: currentConfig.groupId,
      weekNumber,
    });
    const day = week?.[dayNumber] ?? {};
    const dayName = WEEKDAY_NAMES[dayNumber];

    const text = (() => {
      if (!week) {
        return getNoDataText({
          dayNumber,
          weekNumber,
          group: currentConfig,
        });
      }

      if (session.watchType === WATCH_TYPE.DAY) {
        if (dayNumber === WEEKEND) {
          return getWeekendText({
            dayNumber,
            weekNumber,
            group: currentConfig,
          });
        }

        return getDayText({
          day,
          dayNumber,
          weekNumber,
          group: currentConfig,
        });
      }

      return getWeekText({
        group: currentConfig,
        weekNumber,
        week,
      });
    })();

    const keyboard = (() => {
      const inlineKeyboard = new InlineKeyboard();

      if (session.watchType === WATCH_TYPE.DAY) {
        inlineKeyboard
          .text("⬅️", CALLBACK_DATA.SCHEDULE_DAY_PREV)
          .text(`📅 ${dayName}`, CALLBACK_DATA.SCHEDULE_DAY_RESET)
          .text("➡️", CALLBACK_DATA.SCHEDULE_DAY_NEXT)
          .row();
        inlineKeyboard
          .text("🗓 На неделю", CALLBACK_DATA.SCHEDULE_SWITCH_TOWEEK)
          .row();
      } else {
        inlineKeyboard
          .text("⬅️", CALLBACK_DATA.SCHEDULE_WEEK_PREV)
          .text(`📅 Неделя ${weekNumber}`, CALLBACK_DATA.SCHEDULE_WEEK_RESET)
          .text("➡️", CALLBACK_DATA.SCHEDULE_WEEK_NEXT)
          .row();
        inlineKeyboard
          .text("🗓 На день", CALLBACK_DATA.SCHEDULE_SWITCH_TODAY)
          .row();
      }

      const others = configs.filter((config) => config.id !== currentConfig.id);
      others.forEach((config, index) => {
        inlineKeyboard.text(
          `🔎 ${config.group}`,
          `${CALLBACK_DATA.GROUPS_SCHEDULE}:${config.group}`,
        );
        if (index % 2 === 1) {
          inlineKeyboard.row();
        }
      });
      if (others.length > 0) {
        inlineKeyboard.row();
      }

      inlineKeyboard
        .text("Обычное расписание", CALLBACK_DATA.SCHEDULE_STANDART)
        .row();
      inlineKeyboard.text("В главное меню", CALLBACK_DATA.MENU_BACK).row();

      return inlineKeyboard;
    })();

    await conversation.external(({ session }) => {
      if (
        session.quickDate !== QUICK_DATE.NONE &&
        session.currentDayOffset !== dayOffset
      ) {
        session.currentDayOffset = dayOffset;
      }

      session.last.conversation = GroupsScheduleConversation.name;
      session.last.quickConfigGroup = currentConfig.group;
      session.quickConfigGroup = null;
      session.quickDate = QUICK_DATE.NONE;
    });

    await sendOrEditMessage(context, text, {
      keyboard,
      session,
      conversation,
    });
  }
}
