import { GrammyError, InlineKeyboard } from "grammy";
import { Context, MyConversation } from "../bot";
import { SessionData } from "../session";

const SAME_TEXT_ERROR_DESCRIPTION =
  "Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message";

export async function sendOrEditMessage(
  interaction: Context,
  text: string,
  {
    keyboard,
    session,
    conversation,
  }: {
    keyboard?: InlineKeyboard;
    session?: SessionData;
    conversation?: MyConversation;
  },
) {
  session =
    (await conversation?.external((context) => context.session)) ||
    interaction.session;
  if (!session) {
    throw new Error("Session not found.");
  }

  const chatId = interaction.chat?.id;
  if (!chatId) {
    throw new Error("Chat ID не найден");
  }

  const lastMessageId = session.lastBotMessageId;
  const lastChatId = session.lastChatId;

  try {
    if (lastMessageId && lastChatId === chatId) {
      return interaction.api.editMessageText(chatId, lastMessageId, text, {
        reply_markup: keyboard,
        parse_mode: "HTML",
      });
    }

    const msg = await interaction.reply(text, {
      reply_markup: keyboard,
      parse_mode: "HTML",
    });
    
    session.lastBotMessageId = msg.message_id;
    session.lastChatId = chatId;
  } catch (error) {
    if (error instanceof GrammyError) {
      if (error.description === SAME_TEXT_ERROR_DESCRIPTION) {
        return interaction.answerCallbackQuery("Ничего не изменилось");
      }
    }

    const msg = await interaction.reply(text, {
      reply_markup: keyboard,
      parse_mode: "HTML",
    });

    session.lastBotMessageId = msg.message_id;
    session.lastChatId = chatId;
  } finally {
    await conversation?.external((context) => {
      context.session = session;
    });
  }
}
