import { Context } from '../bot';
import { UserService } from '../../services/user.service';
import { configSelectionKeyboard, mainMenuKeyboard } from '../keyboards';
import { handleToday, handleTomorrow, handleWeek } from './schedule';
import { sendOrEditMessage } from '../utils/messageHelper';

const userService = new UserService();

export async function menuCallbackHandler(ctx: Context) {
  const data = ctx.callbackQuery?.data;
  const telegramId = ctx.from!.id;

  const activeConfig = await userService.getActiveConfig(`${telegramId}`);
  if (!activeConfig) {
    await ctx.answerCallbackQuery('Сначала настройте группу через /start');
    return;
  }

  switch (data) {
    case 'menu:today':
      await handleToday(ctx);
      break;
    case 'menu:tomorrow':
      await handleTomorrow(ctx);
      break;
    case 'menu:week':
      await handleWeek(ctx);
      break;
    case 'menu:change_group':
      await ctx.conversation.enter('registration');
      await ctx.answerCallbackQuery();
      break;
    case 'menu:switch_group': {
      const configs = await userService.getUserConfigs(`${telegramId}`);
      if (configs.length === 0) {
        await sendOrEditMessage(ctx, 'У вас нет сохранённых групп. Начните регистрацию: /start');
        return;
      }
      const keyboard = configSelectionKeyboard(configs);
      await sendOrEditMessage(ctx, 'Выберите группу для активации или добавьте новую:', keyboard);
      await ctx.answerCallbackQuery();
      break;
    }
    case 'menu:back':
      await sendOrEditMessage(ctx, 'Главное меню', mainMenuKeyboard());
      await ctx.answerCallbackQuery();
      break;
    default:
      await ctx.answerCallbackQuery('Неизвестная команда меню');
  }
}