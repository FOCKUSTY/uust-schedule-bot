import { Context } from '../bot';
import { UserService } from '../../services/user.service';
import { mainMenuKeyboard, configSelectionKeyboard } from '../keyboards';
import { sendOrEditMessage } from '../utils/messageHelper';

const userService = new UserService();

export async function startHandler(ctx: Context) {
  const telegramId = ctx.from!.id;
  const configs = await userService.getUserConfigs(`${telegramId}`);

  // Сбрасываем ID последнего сообщения, чтобы начать с нового
  ctx.session.lastBotMessageId = undefined;
  ctx.session.lastChatId = undefined;

  if (configs.length === 0) {
    await ctx.conversation.enter('registration');
  } else if (configs.length === 1) {
    await sendOrEditMessage(
      ctx,
      `👤 Ваша группа: ${configs[0].group}`,
      mainMenuKeyboard()
    );
  } else {
    const keyboard = configSelectionKeyboard(configs);
    await sendOrEditMessage(
      ctx,
      '📋 Выберите активную группу или добавьте новую:',
      keyboard
    );
  }
}