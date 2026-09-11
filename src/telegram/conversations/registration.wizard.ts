// src/telegram/conversations/registration.wizard.ts

import type { Context, MyConversation } from "../bot";
import { InlineKeyboard } from "grammy";

import { UserService } from "../../database/user.service";
import type { GroupInformation } from "../../schedule";
import { ScheduleApiProvider } from "../../schedule/providers/aparkit-schedule.provider";

import { CALLBACK_DATA } from "../constants/callback-data";
import { mainMenuKeyboard } from "../keyboards";
import { sendOrEditMessage } from "../utils/send-or-edit";

/** Callback-префиксы (передаём индекс, а не строку) */
const FACULTY_PREFIX = "reg:faculty";
const COURSE_PREFIX = "reg:course";
const SPEC_PREFIX = "reg:spec";
const GROUP_PREFIX = "reg:group";

/** Regexp для waitForCallbackQuery */
const WAIT_FACULTY = /^reg:(faculty:\d+|cancel)$/;
const WAIT_COURSE = /^reg:(course:\d+|back_to_faculty|cancel)$/;
const WAIT_SPEC = /^reg:(spec:\d+|back_to_course|cancel)$/;
const WAIT_GROUP = /^reg:(group:\d+|back_to_spec|cancel)$/;

const PAGE_SIZE = 8; // сколько кнопок групп на одной странице

export class RegistrationWizard {
  private readonly userService: UserService;
  private readonly provider: ScheduleApiProvider;

  public constructor(
    userService: UserService,
    provider: ScheduleApiProvider = new ScheduleApiProvider(),
  ) {
    this.userService = userService;
    this.provider = provider;
  }

  public async start(
    conversation: MyConversation,
    ctx: Context,
  ): Promise<void> {
    try {
      const faculties = await this.provider.getFaculties();

      if (faculties.length === 0) {
        await ctx.reply(
          "😕 Не удалось получить список факультетов. Попробуйте позже.",
        );
        return;
      }

      await this.askFaculty(conversation, ctx, faculties);
    } catch (error) {
      console.error("[RegistrationWizard] start error:", error);
      await ctx.reply("⚠️ Ошибка при получении данных. Попробуйте позже.");
    }
  }

  // ==================== ШАГ 1: ФАКУЛЬТЕТ ====================

  private async askFaculty(
    conversation: MyConversation,
    ctx: Context,
    faculties: string[],
  ): Promise<void> {
    const keyboard = new InlineKeyboard();
    faculties.forEach((faculty, index) => {
      keyboard.text(faculty, `${FACULTY_PREFIX}:${index}`).row();
    });
    keyboard.text("❌ Отмена", CALLBACK_DATA.REG_CANCEL);

    await sendOrEditMessage(ctx, "🎓 Выберите факультет:", {
      keyboard,
      conversation,
    });

    const sel = await conversation.waitForCallbackQuery(WAIT_FACULTY);
    await sel.answerCallbackQuery().catch(() => {});

    if (sel.callbackQuery.data === CALLBACK_DATA.REG_CANCEL) {
      return this.cancel(ctx, conversation);
    }

    const match = sel.callbackQuery.data.match(/^reg:faculty:(\d+)$/);
    if (!match) return;

    const faculty = faculties[Number(match[1])];
    if (!faculty) return this.start(conversation, ctx);

    const courses = await this.provider.getCourses(faculty);
    if (courses.length === 0) {
      await sendOrEditMessage(
        ctx,
        `😕 Для «${faculty}» не найдено курсов.`,
        { conversation },
      );
      return;
    }

    return this.askCourse(conversation, ctx, faculty, courses);
  }

  // ==================== ШАГ 2: КУРС ====================

  private async askCourse(
    conversation: MyConversation,
    ctx: Context,
    faculty: string,
    courses: string[],
  ): Promise<void> {
    const keyboard = new InlineKeyboard();
    courses.forEach((course, index) => {
      keyboard.text(`${course} курс`, `${COURSE_PREFIX}:${index}`).row();
    });
    keyboard.text("🔙 Назад", CALLBACK_DATA.REG_BACK_TO_COURSE).row();
    keyboard.text("❌ Отмена", CALLBACK_DATA.REG_CANCEL);

    await sendOrEditMessage(
      ctx,
      `🎓 ${faculty}\n📚 Выберите курс:`,
      { keyboard, conversation },
    );

    const sel = await conversation.waitForCallbackQuery(WAIT_COURSE);
    await sel.answerCallbackQuery().catch(() => {});
    const data = sel.callbackQuery.data;

    if (data === CALLBACK_DATA.REG_CANCEL) return this.cancel(ctx, conversation);
    if (data === CALLBACK_DATA.REG_BACK_TO_COURSE) {
      const faculties = await this.provider.getFaculties();
      return this.askFaculty(conversation, ctx, faculties);
    }

    const match = data.match(/^reg:course:(\d+)$/);
    if (!match) return;
    const course = courses[Number(match[1])];
    if (!course) return this.start(conversation, ctx);

    const specializations = await this.provider.getSpecializations(
      faculty,
      course,
    );
    if (specializations.length === 0) {
      await sendOrEditMessage(
        ctx,
        `😕 Для ${course} курса не найдено специальностей.`,
        { conversation },
      );
      return;
    }

    return this.askSpecialization(
      conversation,
      ctx,
      faculty,
      course,
      specializations,
    );
  }

  // ==================== ШАГ 3: СПЕЦИАЛЬНОСТЬ ====================

  private async askSpecialization(
    conversation: MyConversation,
    ctx: Context,
    faculty: string,
    course: string,
    specializations: string[],
  ): Promise<void> {
    const keyboard = new InlineKeyboard();
    specializations.forEach((spec, index) => {
      keyboard.text(spec, `${SPEC_PREFIX}:${index}`).row();
    });
    keyboard.text("🔙 Назад", CALLBACK_DATA.REG_BACK_TO_COURSE).row();
    keyboard.text("❌ Отмена", CALLBACK_DATA.REG_CANCEL);

    await sendOrEditMessage(
      ctx,
      `🎓 ${faculty} · ${course} курс\n📖 Выберите специальность:`,
      { keyboard, conversation },
    );

    const sel = await conversation.waitForCallbackQuery(WAIT_SPEC);
    await sel.answerCallbackQuery().catch(() => {});
    const data = sel.callbackQuery.data;

    if (data === CALLBACK_DATA.REG_CANCEL) return this.cancel(ctx, conversation);
    if (data === CALLBACK_DATA.REG_BACK_TO_COURSE) {
      const courses = await this.provider.getCourses(faculty);
      return this.askCourse(conversation, ctx, faculty, courses);
    }

    const match = data.match(/^reg:spec:(\d+)$/);
    if (!match) return;
    const specialization = specializations[Number(match[1])];
    if (!specialization) return this.start(conversation, ctx);

    const groups = await this.provider.getGroupsByFilters(
      faculty,
      course,
      specialization,
    );
    if (groups.length === 0) {
      await sendOrEditMessage(ctx, `😕 Для «${specialization}» нет групп.`, {
        conversation,
      });
      return;
    }

    return this.askGroup(
      conversation,
      ctx,
      { faculty, course, specialization },
      groups,
    );
  }

  // ==================== ШАГ 4: ГРУППА ====================

  private async askGroup(
    conversation: MyConversation,
    ctx: Context,
    filters: { faculty: string; course: string; specialization: string },
    groups: Array<{ id: number; title: string }>,
    page: number = 0,
  ): Promise<void> {
    const totalPages = Math.ceil(groups.length / PAGE_SIZE);
    const start = page * PAGE_SIZE;
    const slice = groups.slice(start, start + PAGE_SIZE);

    const keyboard = new InlineKeyboard();
    slice.forEach((group, i) => {
      keyboard.text(group.title, `${GROUP_PREFIX}:${group.id}`);
      if (i % 2 === 1) keyboard.row();
    });
    if (slice.length % 2 === 1) keyboard.row();

    if (totalPages > 1) {
      const prevPage = page > 0 ? page - 1 : totalPages - 1;
      const nextPage = page < totalPages - 1 ? page + 1 : 0;
      keyboard
        .text("⬅️", `${GROUP_PREFIX}:page:${prevPage}`)
        .text(`${page + 1}/${totalPages}`, `${GROUP_PREFIX}:noop`)
        .text("➡️", `${GROUP_PREFIX}:page:${nextPage}`)
        .row();
    }

    keyboard.text("🔙 Назад", CALLBACK_DATA.REG_BACK_TO_SPEC).row();
    keyboard.text("❌ Отмена", CALLBACK_DATA.REG_CANCEL);

    await sendOrEditMessage(
      ctx,
      `🎓 ${filters.faculty}\n📚 ${filters.course} курс · 📖 ${filters.specialization}\n\n👥 Выберите группу:`,
      { keyboard, conversation },
    );

    const sel = await conversation.waitForCallbackQuery(WAIT_GROUP);
    await sel.answerCallbackQuery().catch(() => {});
    const data = sel.callbackQuery.data;

    if (data === CALLBACK_DATA.REG_CANCEL) return this.cancel(ctx, conversation);
    if (data === CALLBACK_DATA.REG_BACK_TO_SPEC) {
      const specs = await this.provider.getSpecializations(
        filters.faculty,
        filters.course,
      );
      return this.askSpecialization(
        conversation,
        ctx,
        filters.faculty,
        filters.course,
        specs,
      );
    }

    if (data === `${GROUP_PREFIX}:noop`) {
      return this.askGroup(conversation, ctx, filters, groups, page);
    }

    const pageMatch = data.match(/^reg:group:page:(\d+)$/);
    if (pageMatch) {
      return this.askGroup(
        conversation,
        ctx,
        filters,
        groups,
        Number(pageMatch[1]),
      );
    }

    const match = data.match(/^reg:group:(\d+)$/);
    if (!match) return;
    const groupId = Number(match[1]);
    const selected = groups.find((g) => g.id === groupId);
    if (!selected) return this.start(conversation, ctx);

    return this.saveGroup(ctx, {
      // ⚠️ В GroupInformation нет поля faculty!
      course: filters.course,
      specialization: filters.specialization,
      group: selected.title,
    });
  }

  // ==================== УТИЛИТЫ ====================

  private async cancel(ctx: Context, conversation: MyConversation) {
    await sendOrEditMessage(ctx, "❌ Регистрация отменена.", { conversation });
  }

  private async saveGroup(
    ctx: Context,
    group: GroupInformation,
  ): Promise<void> {
    await this.userService.addConfig(ctx.from!.id, group, true);
    await ctx.reply(`✅ Группа «${group.group}» сохранена!`);
    await sendOrEditMessage(ctx, "Главное меню", {
      keyboard: mainMenuKeyboard(),
    });
  }
}