import { UserService } from "../../database/user.service";
import { Context } from "../bot";
import { CALLBACK_DATA } from "../constants/callback-data";
import { REGISTRATION_CONVERSATION } from "../conversations/registration";
import { SCHEDULE_CONVERSATION } from "../conversations/schedule";
import { configSelectionKeyboard, mainMenuKeyboard } from "../keyboards";
import { sendOrEditMessage } from "../utils/send-or-edit";

const userService = new UserService();

export async function menuCallbackHandler(ctx: Context) {
  const data = ctx.callbackQuery?.data;
  const telegramId = ctx.from!.id;

  // Проверяем наличие активных конфигураций для некоторых действий
  const activeConfigs = await userService.getActiveConfigs(telegramId);
  const hasActiveConfig = activeConfigs.length > 0;

  switch (data) {
    case CALLBACK_DATA.MENU_TODAY:
    case CALLBACK_DATA.MENU_TOMORROW:
    case CALLBACK_DATA.MENU_WEEK:
      if (!hasActiveConfig) {
        await ctx.answerCallbackQuery("Сначала выберите активную группу");
        return sendOrEditMessage(ctx, "У вас нет активных групп. Добавьте через меню.", {
          keyboard: mainMenuKeyboard(),
        });
      }
      await ctx.conversation.enter(SCHEDULE_CONVERSATION);
      break;

    case CALLBACK_DATA.MENU_SWITCH_GROUP:
    case CALLBACK_DATA.MENU_ADD_GROUP:
      await ctx.conversation.enter(REGISTRATION_CONVERSATION);
      await ctx.answerCallbackQuery();
      break;

    case CALLBACK_DATA.MENU_BACK:
      await sendOrEditMessage(ctx, "Главное меню", {
        keyboard: mainMenuKeyboard(),
      });
      await ctx.answerCallbackQuery();
      break;

    default:
      await ctx.answerCallbackQuery("Неизвестная команда меню");
  }
}