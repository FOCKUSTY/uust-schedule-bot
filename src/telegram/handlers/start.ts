import { Context } from '../bot';
import { UserService } from '../../services/user.service';
import { mainMenuKeyboard, configSelectionKeyboard } from '../keyboards';

const userService = new UserService();

export async function startHandler(ctx: Context) {
  const telegramId = ctx.from!.id;
  const configs = await userService.getUserConfigs(`${telegramId}`);

  if (configs.length === 0) {
    await ctx.conversation.enter('registration');
  } else if (configs.length === 1) {
    await ctx.reply(`👤 Ваша группа: ${configs[0].group}`, {
      reply_markup: mainMenuKeyboard(),
    });
  } else {
    const keyboard = configSelectionKeyboard(configs);
    await ctx.reply('📋 Выберите активную группу или добавьте новую:', {
      reply_markup: keyboard,
    });
  }
}