import { PARSE_MODE } from "@/constants";
import { Context, MyConversation, SessionData } from "@/types";
import { InlineKeyboard } from "grammy";

export async function sendOrEditMessage(
  context: Context,
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
    context.session;
  if (!session) {
    throw new Error("Session not found.");
  }

  const chatId = context.chat?.id;
  if (!chatId) {
    throw new Error("Chat ID не найден");
  }

  const lastMessageId = session.lastBotMessageId;
  const lastChatId = session.lastChatId;

  const reply = async () => {
    const msg = await context.reply(text, {
      reply_markup: keyboard,
      parse_mode: PARSE_MODE,
    });

    session.lastBotMessageId = msg.message_id;
    session.lastChatId = chatId;
  };

  try {
    if (!lastMessageId || lastChatId !== chatId) {
      return reply();
    }

    await context.api
      .editMessageText(chatId, lastMessageId, text, {
        reply_markup: keyboard,
        parse_mode: PARSE_MODE,
      })
      .catch(reply);

    if (!context.message) {
      return;
    }
  } catch (error) {
    return reply();
  } finally {
    await conversation?.external((context) => {
      context.session = session;
    });
  }
}
