import { PARSE_MODE } from "@/constants";
import { Context, MyConversation, SessionData } from "@/types";
import { InlineKeyboard } from "grammy";

function splitText(text: string, limit: number = 4000): string[] {
  const chunks: string[] = [];
  let current = "";
  const paragraphs = text.split("\n\n");

  for (const p of paragraphs) {
    if (current.length + p.length + 2 > limit) {
      if (current) chunks.push(current);
      current = p;
    } else {
      current += (current ? "\n\n" : "") + p;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export const sendOrEditMessage = async (
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
) => {
  session =
    (await conversation?.external((context) => context.session)) ||
    context.session;
  if (!session) throw new Error("Session not found.");

  const chatId = context.chat?.id;
  if (!chatId) throw new Error("Chat ID не найден");

  const lastMessageId = session.lastBotMessageId;
  const lastChatId = session.lastChatId;

  const chunks = splitText(text);

  if (chunks.length > 1) {
    if (lastMessageId && lastChatId === chatId) {
      await context.api.deleteMessage(chatId, lastMessageId).catch(() => {});
    }

    for (let i = 0; i < chunks.length; i++) {
      const isLast = i === chunks.length - 1;
      const msg = await context.reply(chunks[i], {
        reply_markup: isLast ? keyboard : undefined,
        parse_mode: PARSE_MODE,
      });

      if (isLast) {
        session.lastBotMessageId = msg.message_id;
        session.lastChatId = chatId;
      }
    }

    await conversation?.external((ctx) => {
      ctx.session = session;
    });
    return;
  }

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

    if (!context.message) return;
  } catch (error) {
    return reply();
  } finally {
    await conversation?.external((context) => {
      context.session = session;
    });
  }
};
