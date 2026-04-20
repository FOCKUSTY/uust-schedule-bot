import type { CallbackHandler } from "../bot";
import { SCHEDULE_CONVERSATION } from "../conversations/schedule";

import { CALLBACK_DATA } from "../constants/callback-data";

import { NavigationService } from "../services/navigation.service";
import { UserService } from "../../database";
import { sendOrEditMessage } from "../utils/send-or-edit";
import { configSelectionKeyboard } from "../keyboards";

const navigation = new NavigationService();
const userService = new UserService();

const OFFSET_CALLBACKS = [
  CALLBACK_DATA.SCHEDULE_WEEK_PREV,
  CALLBACK_DATA.SCHEDULE_WEEK_NEXT,
  CALLBACK_DATA.SCHEDULE_WEEK_RESET,
  CALLBACK_DATA.SCHEDULE_DAY_PREV,
  CALLBACK_DATA.SCHEDULE_DAY_NEXT,
  CALLBACK_DATA.SCHEDULE_DAY_RESET
] as const;

export class ScheduleHandler {
  public constructor(
    private readonly callbackHandlers: Map<string, CallbackHandler>
  ) {}

  public execute() {
    this.registrOffsetHandlers();
    this.registerDayWeekSwitchHandlers();
    this.registerGroupSwitchHandlers();
  }

  private registrOffsetHandlers() {
    OFFSET_CALLBACKS.forEach((key: string) => {
      this.callbackHandlers.set(key, async (ctx) => {
        navigation.changeOrResetOffset(
          ctx.session,
          key.includes(":week:") ? "week" : "day",
          key.includes("reset")
            ? undefined
            : key.includes("next")
              ? 1
              : -1
        );
        
        return ctx.conversation.enter(SCHEDULE_CONVERSATION);
      });
    });
  }

  private registerDayWeekSwitchHandlers() {
    this.callbackHandlers.set(CALLBACK_DATA.SCHEDULE_SWITCH_TODAY, async (ctx) => {
      navigation.setWatchType(ctx.session, "day");
      return ctx.conversation.enter(SCHEDULE_CONVERSATION);
    });
    
    this.callbackHandlers.set(CALLBACK_DATA.SCHEDULE_SWITCH_TOWEEK, async (ctx) => {
      navigation.setWatchType(ctx.session, "week");
      return ctx.conversation.enter(SCHEDULE_CONVERSATION);
    });
  }

  private registerGroupSwitchHandlers() {
    this.callbackHandlers.set(CALLBACK_DATA.SCHEDULE_SWITCH_GROUP, async (ctx) => {
      const telegramId = ctx.from?.id;
      if (!telegramId) {
        throw new Error("id is not defined.");
      }

      const configs = await userService.getUserConfigs(telegramId);
      if (configs.length === 0) {
        return sendOrEditMessage(
          ctx,
          "У вас нет сохранённых групп. Начните регистрацию: /start",
          {},
        );
      }
      
      const keyboard = configSelectionKeyboard(configs);
      await sendOrEditMessage(
        ctx,
        "Выберите группу для активации или добавьте новую:",
        { keyboard },
      );

      return ctx.answerCallbackQuery();
    })
  }
}