import type { CallbackHandlerModule, CallbackMatcher, Context } from "@/types";
import { UserService } from "../../database";
import { CALLBACK_DATA } from "../callback-data";
import { configSelectionKeyboard, mainMenuKeyboard } from "../keyboards";
import { sendOrEditMessage } from "../utils";
import { CallbackRegister } from "./callback.register";

export class ConfigHandler implements CallbackMatcher, CallbackHandlerModule {
  private readonly _user_service = new UserService();

  public constructor(private readonly registry: CallbackRegister) {}

  public execute() {
    this.registry.matcher(this);
  }

  public verify(data: string): boolean {
    const [prefix] = data.split(":");
    return prefix === CALLBACK_DATA.SELECT_CONFIG;
  }

  public async handle(ctx: Context) {
    const data = ctx.callbackQuery?.data;
    if (!data) {
      return;
    }

    const telegramId = ctx.from?.id;
    if (!telegramId) {
      return;
    }

    const [, dataConfigId, type] = data.split(":");
    const configId = parseInt(dataConfigId);

    try {
      if (type === "default") {
        await this._user_service.toggleDefaultConfig(telegramId, configId);
      } else {
        await this._user_service.toggleConfigActive(telegramId, configId);
      }

      await ctx.answerCallbackQuery("✅ Группа выбрана");
      return sendOrEditMessage(ctx, "Главное меню", {
        keyboard: mainMenuKeyboard(),
      });
    } catch {
      await ctx.answerCallbackQuery("❌ Эта группа недоступна");

      const configs = await this._user_service.getUserConfigs(telegramId);
      const keyboard = configSelectionKeyboard(configs);

      return sendOrEditMessage(ctx, "Пожалуйста, выберите группу из списка:", {
        keyboard,
      });
    }
  }
}
