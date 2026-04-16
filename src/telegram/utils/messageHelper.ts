import { Context } from '../bot';
import { InlineKeyboard } from 'grammy';

export async function sendOrEditMessage(
  ctx: Context,
  text: string,
  keyboard?: InlineKeyboard
) {
  const chatId = ctx.chat?.id;
  if (!chatId) throw new Error('Chat ID не найден');

  const session = ctx.session;
  const lastMessageId = session.lastBotMessageId;
  const lastChatId = session.lastChatId;

  try {
    if (lastMessageId && lastChatId === chatId) {
      await ctx.api.editMessageText(chatId, lastMessageId, text, {
        reply_markup: keyboard,
        parse_mode: 'HTML',
      });
    } else {
      const msg = await ctx.reply(text, {
        reply_markup: keyboard,
        parse_mode: 'HTML',
      });
      session.lastBotMessageId = msg.message_id;
      session.lastChatId = chatId;
    }
  } catch {
    // Если редактирование не удалось — отправляем новое
    const msg = await ctx.reply(text, {
      reply_markup: keyboard,
      parse_mode: 'HTML',
    });
    session.lastBotMessageId = msg.message_id;
    session.lastChatId = chatId;
  }
}