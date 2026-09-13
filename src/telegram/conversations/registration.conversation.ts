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
import { sendOrEditMessage } from "../utils";

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
    if (!faculty) return this.cancel(context, conversation);

    const course = await this.promptCourse(conversation, context, faculty);
    if (!course) return this.cancel(context, conversation);

    const specialization = await this.promptSpecialization(
      conversation,
      context,
      faculty,
      course,
    );
    if (!specialization) return this.cancel(context, conversation);

    const group = await this.promptGroup(
      conversation,
      context,
      faculty,
      course,
      specialization,
    );
    if (!group) return this.cancel(context, conversation);

    const info: GroupInformation = {
      faculty,
      course,
      specialization,
      group: group.title,
      groupId: group.id,
    };

    await conversation.external(() =>
      this._user_service.addConfig(telegramId, info, true),
    );

    await sendOrEditMessage(
      context,
      `✅ Группа сохранена\n\n` +
        `🎓 Факультет: ${faculty}\n` +
        `📚 Курс: ${course}\n` +
        `🏷 Специализация: ${specialization}\n` +
        `👥 Группа: ${group.title}`,
      {
        conversation,
      },
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
      await sendOrEditMessage(
        context,
        "Не удалось получить список факультетов.",
        {
          conversation,
        },
      );
      return null;
    }

    await this.sendPicker(
      conversation,
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
      await sendOrEditMessage(
        context,
        "Для этого факультета нет доступных курсов.",
        { conversation },
      );
      return null;
    }

    await this.sendPicker(
      conversation,
      context,
      "📚 Выберите курс:",
      courses,
      COURSE_PREFIX,
    );

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
      await sendOrEditMessage(
        context,
        "Для этого курса нет доступных специальностей.",
        { conversation },
      );
      return null;
    }

    await this.sendPicker(
      conversation,
      context,
      "🏷 Выберите специальность:",
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
      await sendOrEditMessage(context, "Группы не найдены", {
        conversation,
      });
      return null;
    }

    const titles = groups.map((g) => g.title);
    await this.sendPicker(
      conversation,
      context,
      "👥 Выберите группу:",
      titles,
      GROUP_PREFIX,
    );

    const data = await this.waitForCallback(
      conversation,
      context,
      GROUP_PREFIX,
    );
    const index = data ? this.parseIndex(data, GROUP_PREFIX) : null;
    return index !== null ? (groups[index] ?? null) : null;
  }

  private async sendPicker(
    conversation: MyConversation,
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

    await sendOrEditMessage(context, text, { keyboard, conversation });
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

  private async cancel(
    context: Context,
    conversation: MyConversation,
  ): Promise<void> {
    await sendOrEditMessage(context, "❌ Регистрация отменена.", {
      conversation,
    });
  }
}
