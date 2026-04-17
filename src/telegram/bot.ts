import { Bot, session, Context as GrammyContext } from 'grammy';
import { conversations, createConversation, ConversationFlavor } from '@grammyjs/conversations';
import { env } from '../env';
import { UserService } from '../services/user.service';
import { SessionData, initialSession } from './sessions';
import { startHandler } from './handlers/start';
import { registrationConversation } from './handlers/registration';
import { menuCallbackHandler } from './handlers/menu';
import { scheduleCallbackHandler } from './handlers/schedule';
import { configSelectionKeyboard, mainMenuKeyboard } from './keyboards';

export interface CustomContext extends GrammyContext {
  session: SessionData;
}
export type Context = ConversationFlavor<CustomContext>;

const userService = new UserService();

export const bot = new Bot<Context>(env.TELEGRAM_BOT_TOKEN);

bot.use(session({ initial: () => initialSession() }));
bot.use(conversations());
bot.use(createConversation(registrationConversation as any, 'registration'));

bot.command('start', startHandler);

bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  if (data.startsWith('delete_config:')) {
    const configId = parseInt(data.split(':')[1]);
    await userService.removeConfig(`${telegramId}`, configId);
    await ctx.answerCallbackQuery('🗑️ Группа удалена');
    // Показать обновлённый список
    const configs = await userService.getUserConfigs(`${telegramId}`);
    if (configs.length === 0) {
      await ctx.reply('У вас больше нет сохранённых групп. Используйте /start для регистрации.');
    } else {
      const keyboard = configSelectionKeyboard(configs);
      await ctx.reply('Список групп обновлён:', { reply_markup: keyboard });
    }
    return;
  }

  if (data.startsWith('select_config:')) {
    const configId = parseInt(data.split(':')[1]);
    try {
      await userService.setActiveConfig(`${telegramId}`, configId);
      await ctx.answerCallbackQuery('✅ Группа выбрана');
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard() });
    } catch (error) {
      await ctx.answerCallbackQuery('❌ Эта группа недоступна');
      // Показываем актуальный список групп
      const configs = await userService.getUserConfigs(`${telegramId}`);
      const keyboard = configSelectionKeyboard(configs);
      await ctx.reply('Пожалуйста, выберите группу из списка:', { reply_markup: keyboard });
    }
    return;
  }
  
  if (data === 'menu:add_group') {
    await ctx.conversation.enter('registration');
    await ctx.answerCallbackQuery();
    return;
  }

  if (data.startsWith('select_config:')) {
    const configId = parseInt(data.split(':')[1]);
    await userService.setActiveConfig(`telegramId`, configId);
    await ctx.answerCallbackQuery('✅ Группа выбрана');
    await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard() });
    return;
  }

  if (data.startsWith('menu:')) {
    await menuCallbackHandler(ctx);
    return;
  }

  if (data.startsWith('schedule:')) {
    await scheduleCallbackHandler(ctx);
    await ctx.answerCallbackQuery();
    return;
  }

  await ctx.answerCallbackQuery('Неизвестная команда');
});

bot.on('message:text', async (ctx) => {
  await ctx.reply('Используйте кнопки меню для взаимодействия.');
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`❌ Ошибка при обработке обновления ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof Error) {
    console.error(e.stack || e.message);
  } else {
    console.error(e);
  }
  ctx.reply('⚠️ Произошла внутренняя ошибка. Попробуйте позже.').catch(() => {});
});

bot.start({
  onStart: () => console.log(`✅ Бот @${bot.botInfo.username} запущен`),
});

process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());