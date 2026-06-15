import { Conversation } from "@grammyjs/conversations";
import { bot, Context } from "../bot";
import { StringBuilder } from "../utils/string-builder";
import { env } from "../../env";
import { deleteMessage } from "../utils/delete-message";

export const SEND_CONVERSATION = "users:send";
export const sendConversation = async (
  conversation: Conversation<Context, Context>,
  ctx: Context,
) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    return ctx.reply("Not access.");
  }

  const helpMessage = new StringBuilder()
    .append("Введите сообщение, которые вы хотите оправить ")
    .link("https://t.me/fockusty", "создателю")
    .appendLine()
    .quote("Создателю будет доступен ваш идентификатор пользователя для обратной связи")
    .toString();

  await ctx.reply(helpMessage);

  const message = await conversation.waitFor(":text");
  const rawText = message.message?.text?.trim();
  if (!rawText || !message.message) {
    return ctx.reply("Текст не был найден");
  }

  const text = new StringBuilder()
    .appendLine(`Пришло сообщение`)
    .append("user:").code(`${ctx.from.id}`).newLine()
    .append("message:").code(`${message.message.message_id}`).newLine()
    .quote(rawText)
    .toString();

  bot.api.sendMessage(env.BOT_CREATOR_ID, text, {
    parse_mode: "HTML"
  }).then(() => {
    return bot.api.sendMessage(telegramId!, "Сообщение было доставлено", {
      reply_parameters: {
        message_id: message.message.message_id
      }
    }).then(deleteMessage(telegramId)).catch(console.error);
  });

  const messageToDelete = await ctx.reply("Сообщение было отправлено.");
  deleteMessage(telegramId)(messageToDelete);
  
  return;
}

export const CREATOR_SEND_CONVERSATION = "creator:send";
export const creatorSendConversation = async (
  conversation: Conversation<Context, Context>,
  ctx: Context,
) => {
  const telegramId = ctx.from?.id
  if (!telegramId) {
    return ctx.reply("Not access.");
  }

  await ctx.reply("Введите id пользователя, которому хотите ответить");

  const messageWithId = await conversation.waitFor(":text");
  const id = messageWithId.message?.text.trim();
  if (!id) {
    return ctx.reply("Текст не был найден");
  }

  await ctx.reply("Введите сообщение");
  const messageWithText = await conversation.waitFor(":text");
  const rawText = messageWithText.message?.text.trim();
  if (!rawText || !messageWithText.message) {
    return ctx.reply("Текст не был найден");
  }

  const [ userId, messageId ] = id.split(",");
  if (!userId) {
    return ctx.reply("id пользователя не было найдено");
  }

  const text = new StringBuilder()
    .appendLine("Вам пришёл ответ от создателя")
    .quote(rawText)
    .toString();

  const options = messageId ? {
    reply_parameters: {
      message_id: +messageId
    }
  } : undefined;

  bot.api.sendMessage(+userId, text, options).then(() => {
    return bot.api.sendMessage(telegramId, "Сообщение было доставлено", {
      reply_parameters: {
        message_id: messageWithText.message.message_id
      }
    }).then(deleteMessage(telegramId)).catch(console.error);
  });

  const messageToDelete = await ctx.reply("Сообщение было отправлено");
  deleteMessage(telegramId)(messageToDelete);

  return;
}