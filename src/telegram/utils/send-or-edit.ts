import { InlineKeyboard } from "grammy";
import { Context, MyConversation } from "../bot";
import { SessionData } from "../session";

export async function sendOrEditMessage(
  interaction: Context,
  text: string,
  {
    keyboard,
    session,
    conversation
  }: {
    keyboard?: InlineKeyboard,
    session?: SessionData,
    conversation?: MyConversation
  },
) {
  session = await conversation?.external((context) => context.session) || interaction.session;
  if (!session) {
    throw new Error("Session not found.");
  }

  const chatId = interaction.chat?.id;
  if (!chatId) {
    throw new Error('Chat ID не найден');
  }

  const lastMessageId = session.lastBotMessageId;
  const lastChatId = session.lastChatId;

  try {
    if (lastMessageId && lastChatId === chatId) {
      await interaction.api.editMessageText(chatId, lastMessageId, text, {
        reply_markup: keyboard,
        parse_mode: 'HTML',
      });
    } else {
      const msg = await interaction.reply(text, {
        reply_markup: keyboard,
        parse_mode: 'HTML',
      });
      session.lastBotMessageId = msg.message_id;
      session.lastChatId = chatId;
    }
  } catch {
    const msg = await interaction.reply(text, {
      reply_markup: keyboard,
      parse_mode: 'HTML',
    });
    session.lastBotMessageId = msg.message_id;
    session.lastChatId = chatId;
  } finally {
    await conversation?.external(context => {
      context.session = session;
    });
  }
}