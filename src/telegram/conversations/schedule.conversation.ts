import { AparkitSchedule } from "@/classes";
import { UserService } from "@/database";
import { Conversation } from "@/interfaces";
import { MyConversation, Context } from "@/types";
import {
  getDayText,
  getNoDataText,
  getWeekendText,
  getWeekText,
  ScheduleResolver,
  sendOrEditMessage,
} from "../utils";
import { configSelectionKeyboard } from "../keyboards";
import { WEEKDAY_NAMES, WEEKEND } from "@/constants";
import { InlineKeyboard } from "grammy";
import { CALLBACK_DATA } from "../callback-data";

export class ScheduleConversation implements Conversation {
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

    const configs = await this._user_service.getActiveConfigs(telegramId);
    const defaultConfig = configs.find((config) => config.defaulted);

    if (configs.length === 0 || !defaultConfig) {
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
      groupId: defaultConfig.groupId,
      weekNumber,
    });
    const day = week?.[dayNumber] ?? {};
    const dayName = WEEKDAY_NAMES[dayNumber];

    const text = (() => {
      if (!week) {
        return getNoDataText({
          dayNumber,
          weekNumber,
          group: defaultConfig,
        });
      }

      if (session.watchType === "day") {
        if (dayNumber === WEEKEND) {
          return getWeekendText({
            dayNumber,
            weekNumber,
            group: defaultConfig,
          });
        }

        return getDayText({
          day,
          dayNumber,
          weekNumber,
          group: defaultConfig,
        });
      }

      return getWeekText({
        group: defaultConfig,
        weekNumber,
        week,
      });
    })();

    const keyboard = (() => {
      const inlineKeyboard = new InlineKeyboard();

      if (session.watchType === "day") {
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

      inlineKeyboard
        .text("🔄 Сменить группу", CALLBACK_DATA.SCHEDULE_SWITCH_GROUP)
        .text(defaultConfig.group, CALLBACK_DATA.SCHEDULE_PRINT_ALL_GROUPS)
        .row();

      inlineKeyboard
        .text("Вывести все группы", CALLBACK_DATA.SCHEDULE_PRINT_ALL_GROUPS)
        .row();

      return inlineKeyboard;
    })();

    await conversation.external(({ session }) => {
      if (session.quickDate !== "none") {
        session.currentDayOffset = dayOffset;
        // session.currentWeekOffset = weekOffset; // Нужен ли?
      }

      session.quickDate = "none";
    });

    await sendOrEditMessage(context, text, {
      keyboard,
      session,
      conversation,
    });
  }
}
