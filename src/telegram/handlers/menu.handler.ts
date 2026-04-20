import type { CallbackHandler } from "../bot";
import { today, tomorrow } from "../commands/quick-date";

import { CALLBACK_DATA } from "../constants/callback-data";
import { REGISTRATION_CONVERSATION } from "../conversations/registration";
import { SCHEDULE_CONVERSATION } from "../conversations/schedule";
import { mainMenuKeyboard } from "../keyboards";
import { sendOrEditMessage } from "../utils/send-or-edit";

const REGISTRATION_ACTIONS = [
  CALLBACK_DATA.MENU_SWITCH_GROUP,
  CALLBACK_DATA.MENU_ADD_GROUP,
] as const;

export class MenuHandler {
  public constructor(
    private readonly callbackHandlers: Map<string, CallbackHandler>,
  ) {}

  public execute() {
    this.registerScheduleActions();
    this.registerRegistrationActions();
    this.registerBackAction();
  }

  private registerScheduleActions() {
    this.callbackHandlers.set(CALLBACK_DATA.MENU_WEEK, async (ctx) => {
      ctx.session.watchType = "week";
      return ctx.conversation.enter(SCHEDULE_CONVERSATION);
    });

    this.callbackHandlers.set(CALLBACK_DATA.MENU_TODAY, today);
    this.callbackHandlers.set(CALLBACK_DATA.MENU_TOMORROW, tomorrow);
  }

  private registerRegistrationActions() {
    REGISTRATION_ACTIONS.forEach((key) => {
      this.callbackHandlers.set(key, async (ctx) => {
        await ctx.conversation.enter(REGISTRATION_CONVERSATION);
        await ctx.answerCallbackQuery();
      });
    });
  }

  private registerBackAction() {
    this.callbackHandlers.set(CALLBACK_DATA.MENU_BACK, async (ctx) => {
      await sendOrEditMessage(ctx, "Главное меню", {
        keyboard: mainMenuKeyboard(),
      });

      return ctx.answerCallbackQuery();
    });
  }
}
