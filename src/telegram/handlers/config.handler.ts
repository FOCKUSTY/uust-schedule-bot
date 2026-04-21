import type { Context } from "../bot";

import { UserService } from "../../database";
import { CALLBACK_DATA } from "../constants/callback-data";
import { configSelectionKeyboard, mainMenuKeyboard } from "../keyboards";
import { sendOrEditMessage } from "../utils/send-or-edit";

const userService = new UserService();

export class ConfigHandler {
  public constructor() {}

  public verify(data: string): boolean
  public verify(ctx: Context): boolean
  public verify(ctx: Context|string): boolean {
    const callbackData = typeof ctx === "string" ? ctx : ctx.callbackQuery?.data!;
    const [data] = callbackData.split(":");
    if (data !== CALLBACK_DATA.SELECT_CONFIG) {
      return false;
    }

    return true;
  }

  public async handle(ctx: Context) {
    const data = ctx.callbackQuery?.data!;
    const telegramId = ctx.from?.id!;

    const [callbackData, dataConfigId, type] = data.split(":");
    if (!this.verify(callbackData)) {
      return "NON";
    }

    const configId = parseInt(dataConfigId);

    try {
      if (type === "default") {
        await userService.toggleDefaultConfig(telegramId, configId);
      } else {
        await userService.toggleConfigActive(telegramId, configId);
      }

      await ctx.answerCallbackQuery("✅ Группа выбрана");
      return sendOrEditMessage(ctx, "Главное меню", {
        keyboard: mainMenuKeyboard(),
      });
    } catch {
      await ctx.answerCallbackQuery("❌ Эта группа недоступна");

      const configs = await userService.getUserConfigs(telegramId);
      const keyboard = configSelectionKeyboard(configs);

      return sendOrEditMessage(ctx, "Пожалуйста, выберите группу из списка:", {
        keyboard,
      });
    }
  }
}
