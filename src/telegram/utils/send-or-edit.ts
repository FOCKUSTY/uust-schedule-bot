import { GrammyError, InlineKeyboard } from "grammy";
import { Context, MyConversation } from "../bot";
import { SessionData } from "../session";

const SAME_TEXT_ERROR_DESCRIPTION =
  "Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message";

export async function sendOrEditMessage(
  ctx: Context,
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
    (await conversation?.external((context) => context.session)) || ctx.session;
  if (!session) {
    throw new Error("Session not found.");
  }

  const chatId = ctx.chat?.id;
  if (!chatId) {
    throw new Error("Chat ID не найден");
  }

  const lastMessageId = session.lastBotMessageId;
  const lastChatId = session.lastChatId;

  const reply = async () => {
    const msg = await ctx.reply(text, {
      reply_markup: keyboard,
      parse_mode: "HTML",
    });

    session.lastBotMessageId = msg.message_id;
    session.lastChatId = chatId;
  };

  try {
    if (!lastMessageId || lastChatId !== chatId) {
      return reply();
    }

    await ctx.api
      .editMessageText(chatId, lastMessageId, text, {
        reply_markup: keyboard,
        parse_mode: "HTML",
      })
      .catch(reply);

    if (!ctx.message) {
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
