import type { Context, GroupInformation, MyConversation } from "@/types";

import { InlineKeyboard } from "grammy";

import { IsuGroupsProvider } from "@/classes";
import { UserService } from "@/database";
import { CALLBACK_DATA } from "@/telegram/callback-data";
import { Conversation } from "@/interfaces";
import { sendOrEditMessage } from "../utils";
import { mainMenuKeyboard } from "../keyboards";
import { MAX_GROUP_TITLE_LENGTH } from "@/constants";

const GROUP_PREFIX = "reg:group";
const MAX_VISIBLE_RESULTS = 30;

export class RegistrationConversation implements Conversation {
  private readonly _api = new IsuGroupsProvider();
  private readonly _user_service = new UserService();

  public constructor() {}

  public async execute(
    conversation: MyConversation,
    context: Context,
  ): Promise<void> {
    const telegramId = context.from?.id;
    if (!telegramId) return;

    const query = await this.promptQuery(conversation, context);
    if (!query) return this.cancel(context, conversation);

    const results = await conversation.external(() =>
      this._api.searchGroups(query),
    );

    if (results.length === 0) {
      await sendOrEditMessage(
        context,
        `😕 По запросу «${query}» ничего не найдено.\nПопробуйте /start заново или введите другой запрос.`,
        { conversation, keyboard: mainMenuKeyboard() },
      );
      return;
    }

    const picked = await this.promptPick(
      conversation,
      context,
      results.map((r) => r.name),
    );
    if (picked === null) return this.cancel(context, conversation);

    const selected = results[picked];
    const parsed = this._api.parseGroupTitle(selected.name);

    const info: GroupInformation = {
      faculty: parsed.faculty,
      course: parsed.course,
      specialization: parsed.specialization,
      group: selected.name,
      groupId: selected.id,
    };

    await conversation.external(() =>
      this._user_service.addConfig(telegramId, info, true),
    );

    await sendOrEditMessage(
      context,
      `✅ Группа сохранена\n\n` +
        `👥 Группа: ${selected.name}\n` +
        `🏷 Специализация: ${parsed.specialization}\n` +
        `📚 Курс: ${parsed.course}`,
      { conversation, keyboard: mainMenuKeyboard() },
    );
  }

  private async promptQuery(
    conversation: MyConversation,
    context: Context,
  ): Promise<string | null> {
    await sendOrEditMessage(
      context,
      "🔎 Введите название группы (например, «РЭУ» или «2225»):\n\n" +
        "<i>Для отмены отправьте /cancel</i>",
      { conversation },
    );

    const messageContext = await conversation.waitFor("message:text");
    const text = messageContext.message?.text?.trim();
    if (!text || text === "/cancel") return null;

    return text;
  }

  private async promptPick(
    conversation: MyConversation,
    context: Context,
    items: string[],
  ): Promise<number | null> {
    const limited = items.slice(0, MAX_VISIBLE_RESULTS);
    const hint =
      items.length > MAX_VISIBLE_RESULTS
        ? `\n<i>Найдено ${items.length}, показаны первые ${MAX_VISIBLE_RESULTS}. Уточните запрос, если нужной группы нет.</i>`
        : "";

    const keyboard = new InlineKeyboard();
    limited.forEach((item, i) => {
      keyboard
        .text(
          this.truncate(item, MAX_GROUP_TITLE_LENGTH),
          `${GROUP_PREFIX}:${i}`,
        )
        .row();
    });
    keyboard.text("❌ Отмена", CALLBACK_DATA.REG_CANCEL);

    await sendOrEditMessage(context, `👥 Выберите группу:${hint}`, {
      keyboard,
      conversation,
    });

    const callbackContext = await conversation.waitFor("callback_query:data");
    await callbackContext.answerCallbackQuery().catch(() => undefined);

    const data = callbackContext.callbackQuery?.data;
    if (!data || data === CALLBACK_DATA.REG_CANCEL) return null;
    if (!data.startsWith(`${GROUP_PREFIX}:`)) return null;

    const index = Number(data.slice(GROUP_PREFIX.length + 1));
    return Number.isInteger(index) && index >= 0 && index < limited.length
      ? index
      : null;
  }

  private truncate(string: string, max: number): string {
    return string.length > max ? `${string.slice(0, max - 1)}…` : string;
  }

  private async cancel(
    context: Context,
    conversation: MyConversation,
  ): Promise<void> {
    await sendOrEditMessage(context, "❌ Регистрация отменена.", {
      conversation,
    });
  }
}
