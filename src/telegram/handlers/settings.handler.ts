import type { CallbackHandlerModule, CallbackMatcher, Context } from "@/types";
import { UserService } from "../../database";
import { CALLBACK_DATA } from "../callback-data";
import {
  settingsMenuKeyboard,
  subgroupSettingsKeyboard,
  mainMenuKeyboard,
} from "../keyboards";
import { sendOrEditMessage } from "../utils";
import { CallbackRegister } from "./callback.register";

export class SettingsHandler implements CallbackMatcher, CallbackHandlerModule {
  private readonly _user_service = new UserService();

  public constructor(private readonly registry: CallbackRegister) {}

  public execute() {
    this.registry.matcher(this);
  }

  public verify(data: string): boolean {
    return (
      data === CALLBACK_DATA.MENU_SETTINGS ||
      data === CALLBACK_DATA.SETTINGS_SUBGROUPS ||
      data === CALLBACK_DATA.SETTINGS_BACK_TO_MENU ||
      data.startsWith(CALLBACK_DATA.SETTINGS_SUBGROUP_SELECT)
    );
  }

  public async handle(ctx: Context) {
    const data = ctx.callbackQuery?.data;
    if (!data) return;
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    if (data === CALLBACK_DATA.MENU_SETTINGS) {
      await ctx.answerCallbackQuery();
      return sendOrEditMessage(ctx, "⚙️ <b>Настройки</b>\n\nВыберите раздел:", {
        keyboard: settingsMenuKeyboard(),
      });
    }

    if (data === CALLBACK_DATA.SETTINGS_BACK_TO_MENU) {
      await ctx.answerCallbackQuery();
      return sendOrEditMessage(ctx, "⚙️ <b>Настройки</b>\n\nВыберите раздел:", {
        keyboard: settingsMenuKeyboard(),
      });
    }

    if (data === CALLBACK_DATA.SETTINGS_SUBGROUPS) {
      const configs = await this._user_service.getActiveConfigs(telegramId);

      if (configs.length === 0) {
        await ctx.answerCallbackQuery("У вас нет активных групп");
        return;
      }

      await ctx.answerCallbackQuery();
      return sendOrEditMessage(
        ctx,
        "⚙️ <b>Настройки подгрупп</b>\n\nВыберите вашу подгруппу для каждой группы (она будет отображаться первой в расписании):",
        { keyboard: subgroupSettingsKeyboard(configs) },
      );
    }

    if (data.startsWith(CALLBACK_DATA.SETTINGS_SUBGROUP_SELECT)) {
      const parts = data.split(":");
      const configId = parseInt(parts[2]);
      const subgroupValue = parts[3];
      const subgroup = subgroupValue === "none" ? null : subgroupValue;

      try {
        await this._user_service.setConfigSubgroup(
          telegramId,
          configId,
          subgroup,
        );
        await ctx.answerCallbackQuery("✅ Настройка сохранена");

        const configs = await this._user_service.getActiveConfigs(telegramId);
        return sendOrEditMessage(
          ctx,
          "⚙️ <b>Настройки подгрупп</b>\n\nВыберите вашу подгруппу для каждой группы:",
          { keyboard: subgroupSettingsKeyboard(configs) },
        );
      } catch {
        await ctx.answerCallbackQuery("❌ Ошибка при сохранении");
      }
    }
  }
}
