import { Context } from '../bot';
import { UserService } from '../../services/user.service';
import { configSelectionKeyboard, mainMenuKeyboard } from '../keyboards';
import { handleToday, handleTomorrow, handleWeek } from './schedule';

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
    case 'menu:back':
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard() });
      await ctx.answerCallbackQuery();
      break;
    case 'menu:switch_group': {
      const configs = await userService.getUserConfigs(`${telegramId}`);
      if (configs.length === 0) {
        await ctx.reply('У вас нет сохранённых групп. Начните регистрацию: /start');
        return;
      }
      const keyboard = configSelectionKeyboard(configs);
      await ctx.reply('Выберите группу для активации или добавьте новую:', { reply_markup: keyboard });
      await ctx.answerCallbackQuery();
      break;
    }
    default:
      await ctx.answerCallbackQuery('Неизвестная команда меню');
  }
}