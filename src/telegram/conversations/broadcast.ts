import { Conversation } from "@grammyjs/conversations";
import { bot, Context } from "../bot";
import { env } from "../../env";
import { Prisma } from "../../database";

import pLimit from 'p-limit';

const limit = pLimit(30);
const prisma = new Prisma();
async function broadcastInBackground(text: string, api: Context['api']) {
  let cursor: string  | undefined;

  do {
    const batch = await prisma.user.findMany({
      select: { telegramId: true },
      take: 1000,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { telegramId: cursor } : undefined,
      orderBy: { telegramId: 'asc' },
    });

    if (batch.length === 0) {
      break;
    }

    const query = batch.map(({ telegramId }) => {
      return limit(() => {
        try {
          return api.sendMessage(+telegramId, text);
        } catch (error) {
          const message = error instanceof Error ? error.message : `${error}`;
          console.error(`Failed to send to ${telegramId}:`, message);
        }
      });
    });

    await Promise.all(query);

    cursor = batch[batch.length - 1].telegramId;
  } while (true);
}

export const BROADCAST_CONVERSATION = "creator:broadcast";
export const broadcastConversation = async (
  conversation: Conversation<Context, Context>,
  ctx: Context
) => {
  if (ctx.from?.id !== env.BOT_CREATOR_ID) {
    throw new Error('No access.');
  }

  await ctx.reply('Отправьте сообщение для рассылки:');
  const message = await conversation.waitFor(':text');

  const text = message.message?.text?.trim();
  if (!text) {
    return ctx.reply('Сообщение не может быть пустым.');
  }

  broadcastInBackground(text, bot.api);
  
  return ctx.reply('Рассылка запущена. Это займёт некоторое время.');
};