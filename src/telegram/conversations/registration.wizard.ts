import type { Context, MyConversation } from "../bot";
import { UserService } from "../../database/user.service";
import { ScheduleSearch } from "../../uust/search";
import { InlineKeyboard } from "grammy";
import { CALLBACK_DATA } from "../constants/callback-data";
import { mainMenuKeyboard } from "../keyboards";
import { sendOrEditMessage } from "../utils/send-or-edit";

export class RegistrationWizard {
  private readonly userService: UserService;

  public constructor(userService: UserService) {
    this.userService = userService;
  }

  public async start(
    conversation: MyConversation,
    ctx: Context,
  ): Promise<void> {
    await ctx.reply(
      "📚 Введите название группы (например, РЭУ(ц)2225 или ИСП2325):",
    );

    const response = await conversation.waitFor(":text");
    const query = response.message?.text?.trim();
    if (!query) {
      await ctx.reply("❌ Название не может быть пустым. Попробуйте снова.");
      return this.start(conversation, ctx);
    }

    const searcher = new ScheduleSearch();
    const results = await searcher.searchGroups(query);

    if (results.length === 0) {
      await ctx.reply(
        "😕 Группы не найдены. Проверьте название и попробуйте снова.",
      );
      return this.start(conversation, ctx);
    }

    if (results.length === 1) {
      await this.saveGroup(ctx, results[0]);
      return;
    }

    const keyboard = new InlineKeyboard();
    results.forEach(({ id, name }) => {
      keyboard.text(name, `select_group:${id}`).row();
    });
    keyboard.text("❌ Отмена", CALLBACK_DATA.REG_CANCEL);

    await ctx.reply(
      `🔍 Найдено ${results.length} групп. Выберите нужную:`,
      { reply_markup: keyboard },
    );

    const selection = await conversation.waitForCallbackQuery(
      /^select_group:\d+$/,
    );
    const data = selection.callbackQuery.data;

    if (data === CALLBACK_DATA.REG_CANCEL) {
      await ctx.reply("❌ Регистрация отменена.");
      return;
    }

    const groupId = parseInt(data.split(":")[1], 10);
    const selected = results.find((r) => r.id === groupId);
    if (!selected) {
      await ctx.reply("⚠️ Произошла ошибка. Попробуйте снова.");
      return this.start(conversation, ctx);
    }

    await this.saveGroup(ctx, selected);
  }

  private async saveGroup(
    ctx: Context,
    group: { id: number; name: string },
  ): Promise<void> {
    await this.userService.addConfig(
      ctx.from!.id,
      {
        course: "isu",
        specialization: "isu",
        group: group.name,
      },
      true,
    );

    await ctx.reply(`✅ Группа «${group.name}» сохранена!`);
    await sendOrEditMessage(ctx, "Главное меню", {
      keyboard: mainMenuKeyboard(),
    });
  }
}