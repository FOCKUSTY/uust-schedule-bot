import type { CallbackHandler } from "../bot";

import { UserService } from "../../database/user.service";
import { CALLBACK_DATA } from "../constants/callback-data";
import { REGISTRATION_CONVERSATION } from "../conversations/registration";
import { SCHEDULE_CONVERSATION } from "../conversations/schedule";
import { mainMenuKeyboard } from "../keyboards";
import { sendOrEditMessage } from "../utils/send-or-edit";

const userService = new UserService();

const SCHEDULE_ACTIONS = [
  CALLBACK_DATA.MENU_TODAY,
  CALLBACK_DATA.MENU_TOMORROW,
  CALLBACK_DATA.MENU_WEEK,
] as const;

const REGISTRATION_ACTIONS = [
  CALLBACK_DATA.MENU_SWITCH_GROUP,
  CALLBACK_DATA.MENU_ADD_GROUP,
] as const;

export class MenuHandler {
  public constructor(
    private readonly callbackHandlers: Map<string, CallbackHandler>
  ) {}

  public execute() {
    this.registerScheduleActions();
    this.registerRegistrationActions();
    this.registerBackAction();
  }

  private registerScheduleActions() {
    SCHEDULE_ACTIONS.forEach((key) => {
      this.callbackHandlers.set(key, async (ctx) => {
        const telegramId = ctx.from?.id;
        if (!telegramId) {
          await ctx.answerCallbackQuery("Ошибка: пользователь не идентифицирован");
          return;
        }

        const activeConfigs = await userService.getActiveConfigs(telegramId);
        const hasActiveConfig = activeConfigs.length > 0;

        if (!hasActiveConfig) {
          await ctx.answerCallbackQuery("Сначала выберите активную группу");
          return sendOrEditMessage(
            ctx,
            "У вас нет активных групп. Добавьте через меню.",
            { keyboard: mainMenuKeyboard() }
          );
        }

        await ctx.conversation.enter(SCHEDULE_CONVERSATION);
        return ctx.answerCallbackQuery();
      });
    });
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
      await sendOrEditMessage(ctx, "Главное меню", { keyboard: mainMenuKeyboard() });
      await ctx.answerCallbackQuery();
    });
  }
}