import { UserService } from "../../database/user.service";
import { Context } from "../bot";
import { SCHEDULE_CONVERSATION } from "../conversations/schedule";
import { configSelectionKeyboard, mainMenuKeyboard } from "../keyboards";
import { sendOrEditMessage } from "../utils/send-or-edit";

const userService = new UserService();

export async function menuCallbackHandler(interaction: Context) {
  const data = interaction.callbackQuery?.data;
  const telegramId = interaction.from!.id;

  const activeConfig = await userService.getActiveConfigs(`${telegramId}`);
  if (!activeConfig) {
    await interaction.answerCallbackQuery(
      "Сначала настройте группу через /start",
    );
    return;
  }

  switch (data) {
    case "menu:today":
      await interaction.conversation.enter(SCHEDULE_CONVERSATION);
      break;

    case "menu:tomorrow":
      await interaction.conversation.enter(SCHEDULE_CONVERSATION);
      break;

    case "menu:week":
      await interaction.conversation.enter(SCHEDULE_CONVERSATION);
      break;

    case "menu:change_group":
    case "menu:add_group":
      await interaction.conversation.enter("registration");
      await interaction.answerCallbackQuery();
      break;

    case "menu:back":
      await sendOrEditMessage(interaction, "Главное меню", {
        keyboard: mainMenuKeyboard(),
      });
      await interaction.answerCallbackQuery();
      break;

    case "menu:switch_group": {
      const configs = await userService.getUserConfigs(telegramId);
      if (configs.length === 0) {
        return sendOrEditMessage(
          interaction,
          "У вас нет сохранённых групп. Начните регистрацию: /start",
          {},
        );
      }

      const keyboard = configSelectionKeyboard(configs);
      await sendOrEditMessage(
        interaction,
        "Выберите группу для активации или добавьте новую:",
        { keyboard },
      );
      await interaction.answerCallbackQuery();
      break;
    }

    default:
      await interaction.answerCallbackQuery("Неизвестная команда меню");
  }
}
