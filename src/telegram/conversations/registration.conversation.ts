import type {
  Context,
  GroupInformation,
  GroupSo,
  MyConversation,
} from "@/types";

import { InlineKeyboard } from "grammy";

import { AparkitApi } from "@/classes";
import { UserService } from "@/database";
import { CALLBACK_DATA } from "@/telegram/callback-data";
import { Conversation } from "@/interfaces";

const FACULTY_PREFIX = "reg:faculty";
const COURSE_PREFIX = "reg:course";
const SPEC_PREFIX = "reg:spec";
const GROUP_PREFIX = "reg:group";

export class RegistrationConversation implements Conversation {
  private readonly _api = new AparkitApi();
  private readonly _user_service = new UserService();

  public constructor() {}

  public async execute(
    conversation: MyConversation,
    context: Context,
  ): Promise<void> {
    const telegramId = context.from?.id;
    if (!telegramId) return;

    const faculty = await this.promptFaculty(conversation, context);
    if (!faculty) return this.cancel(context);

    const course = await this.promptCourse(conversation, context, faculty);
    if (!course) return this.cancel(context);

    const specialization = await this.promptSpecialization(
      conversation,
      context,
      faculty,
      course,
    );
    if (!specialization) return this.cancel(context);

    const group = await this.promptGroup(
      conversation,
      context,
      faculty,
      course,
      specialization,
    );
    if (!group) return this.cancel(context);

    const info: GroupInformation = {
      faculty,
      course,
      specialization,
      group: group.title,
      groupId: group.uust_api_id,
    };

    await conversation.external(() =>
      this._user_service.addConfig(telegramId, info, true),
    );

    await context.reply(
      `✅ Группа сохранена\n\n` +
        `🎓 Факультет: ${faculty}\n` +
        `📚 Курс: ${course}\n` +
        `🏷 Специализация: ${specialization}\n` +
        `👥 Группа: ${group.title}`,
    );
  }

  private async promptFaculty(
    conversation: MyConversation,
    context: Context,
  ): Promise<string | null> {
    const faculties = await conversation.external(() =>
      this._api.getFaculties(),
    );

    if (faculties.length === 0) {
      await context.reply("Не удалось получить список факультетов.");
      return null;
    }

    await this.sendPicker(
      context,
      "🎓 Выберите факультет:",
      faculties,
      FACULTY_PREFIX,
    );

    const data = await this.waitForCallback(
      conversation,
      context,
      FACULTY_PREFIX,
    );
    const index = data ? this.parseIndex(data, FACULTY_PREFIX) : null;
    return index !== null ? (faculties[index] ?? null) : null;
  }

  private async promptCourse(
    conversation: MyConversation,
    context: Context,
    faculty: string,
  ): Promise<string | null> {
    const courses = await conversation.external(() =>
      this._api.getCourses(faculty),
    );

    if (courses.length === 0) {
      await context.reply("Для этого факультета нет доступных курсов.");
      return null;
    }

    await this.sendPicker(context, "📚 Выберите курс:", courses, COURSE_PREFIX);

    const data = await this.waitForCallback(
      conversation,
      context,
      COURSE_PREFIX,
    );
    const index = data ? this.parseIndex(data, COURSE_PREFIX) : null;
    return index !== null ? (courses[index] ?? null) : null;
  }

  private async promptSpecialization(
    conversation: MyConversation,
    context: Context,
    faculty: string,
    course: string,
  ): Promise<string | null> {
    const specs = await conversation.external(() =>
      this._api.getSpecializations(faculty, course),
    );

    if (specs.length === 0) {
      await context.reply("Для этого курса нет доступных специализаций.");
      return null;
    }

    await this.sendPicker(
      context,
      "🏷 Выберите специализацию:",
      specs,
      SPEC_PREFIX,
    );

    const data = await this.waitForCallback(conversation, context, SPEC_PREFIX);
    const index = data ? this.parseIndex(data, SPEC_PREFIX) : null;
    return index !== null ? (specs[index] ?? null) : null;
  }

  private async promptGroup(
    conversation: MyConversation,
    context: Context,
    faculty: string,
    course: string,
    specialization: string,
  ): Promise<GroupSo | null> {
    const groups = await conversation.external(() =>
      this._api.getGroupsByFilter(faculty, course, specialization),
    );

    if (groups.length === 0) {
      await context.reply("Группы не найдены.");
      return null;
    }

    const titles = groups.map((g) => g.title);
    await this.sendPicker(context, "👥 Выберите группу:", titles, GROUP_PREFIX);

    const data = await this.waitForCallback(
      conversation,
      context,
      GROUP_PREFIX,
    );
    const index = data ? this.parseIndex(data, GROUP_PREFIX) : null;
    return index !== null ? (groups[index] ?? null) : null;
  }

  private async sendPicker(
    context: Context,
    text: string,
    items: string[],
    prefix: string,
  ): Promise<void> {
    const keyboard = new InlineKeyboard();
    items.forEach((item, i) => {
      keyboard.text(this.truncate(item, 60), `${prefix}:${i}`).row();
    });
    keyboard.text("❌ Отмена", CALLBACK_DATA.REG_CANCEL);

    await context.reply(text, { reply_markup: keyboard });
  }

  private async waitForCallback(
    conversation: MyConversation,
    context: Context,
    prefix: string,
  ): Promise<string | null> {
    const callbackContext = await conversation.waitFor("callback_query:data");
    await callbackContext.answerCallbackQuery().catch(() => undefined);

    const data = callbackContext.callbackQuery?.data ?? null;
    if (!data) return null;
    if (data === CALLBACK_DATA.REG_CANCEL) return null;
    if (!data.startsWith(`${prefix}:`)) return null;

    return data;
  }

  private parseIndex(data: string, prefix: string): number | null {
    const raw = data.slice(prefix.length + 1);
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : null;
  }

  private truncate(string: string, max: number): string {
    return string.length > max ? `${string.slice(0, max - 1)}…` : string;
  }

  private async cancel(ctx: Context): Promise<void> {
    await ctx.reply("❌ Регистрация отменена.");
  }
}
