import type { Context, MyConversation } from "../bot";
import type { FileInfo, ExcelSheetInfo } from "../../schedule/google";

import { InlineKeyboard } from "grammy";

import { Schedule } from "../../schedule/schedule";
import { UserService } from "../../database/user.service";
import { CALLBACK_DATA } from "../constants/callback-data";
import { mainMenuKeyboard } from "../keyboards";
import { sendOrEditMessage } from "../utils/send-or-edit";

const BACK_SYMBOL = Symbol("back");
const CANCEL_SYMBOL = Symbol("cancel");

type SelectionResult = string | typeof BACK_SYMBOL | typeof CANCEL_SYMBOL;

interface SelectionPromptParams {
  conversation: MyConversation;
  ctx: Context;
  step: number;
  totalSteps: number;
  promptPrefix: string;
  fetchItems: () => Promise<Array<{ name: string }>>;
  callbackPrefix: string;
  backData?: string;
  currentSelectionInfo?: string;
}

export class RegistrationWizard {
  private readonly schedule: Schedule; // нужен только для доступа к getLoader()
  private readonly userService: UserService;

  public constructor(userService: UserService, schedule: Schedule) {
    this.userService = userService;
    this.schedule = schedule;
  }

  public async start(
    conversation: MyConversation,
    ctx: Context,
  ): Promise<void> {
    const course = await this.selectCourse(conversation, ctx);
    if (!course) {
      return this.cancel(ctx, conversation);
    }

    const specialization = await this.selectSpecialization(
      conversation,
      ctx,
      course,
    );
    if (!specialization) {
      return this.cancel(ctx, conversation);
    }

    const group = await this.selectGroup(
      conversation,
      ctx,
      course,
      specialization,
    );
    if (!group) {
      return this.cancel(ctx, conversation);
    }

    await this.userService.addConfig(
      ctx.from!.id,
      { course, specialization, group },
      true,
    );

    await sendOrEditMessage(
      ctx,
      `✅ Группа «${group}» сохранена и выбрана как активная!`,
      { keyboard: mainMenuKeyboard(), conversation },
    );
  }

  private async selectCourse(
    conversation: MyConversation,
    ctx: Context,
  ): Promise<string | null> {
    const loader = this.schedule.getLoader();
    const driveService = loader["driveService"];
    const result = await this.promptForSelection({
      conversation,
      ctx,
      step: 1,
      totalSteps: 3,
      promptPrefix: "выберите курс",
      fetchItems: () => driveService.getCourses(),
      callbackPrefix: CALLBACK_DATA.REG_COURSE_PREFIX,
    });

    if (result === CANCEL_SYMBOL) return null;
    return result as string;
  }

  private async selectSpecialization(
    conversation: MyConversation,
    ctx: Context,
    course: string,
  ): Promise<string | null> {
    const loader = this.schedule.getLoader();
    const driveService = loader["driveService"];
    const result = await this.promptForSelection({
      conversation,
      ctx,
      step: 2,
      totalSteps: 3,
      promptPrefix: "выберите специальность",
      fetchItems: () => driveService.getSpecializations(course),
      callbackPrefix: CALLBACK_DATA.REG_SPEC_PREFIX,
      backData: CALLBACK_DATA.REG_BACK_TO_COURSE,
      currentSelectionInfo: `📖 Курс: ${course}`,
    });

    if (result === CANCEL_SYMBOL) return null;
    if (result === BACK_SYMBOL) return null; // вернёмся в selectCourse
    return result as string;
  }

  private async selectGroup(
    conversation: MyConversation,
    ctx: Context,
    course: string,
    specialization: string,
  ): Promise<string | null> {
    const loader = this.schedule.getLoader();
    const driveService = loader["driveService"];
    const result = await this.promptForSelection({
      conversation,
      ctx,
      step: 3,
      totalSteps: 3,
      promptPrefix: "выберите группу",
      fetchItems: () => driveService.getGroups(course, specialization),
      callbackPrefix: CALLBACK_DATA.REG_GROUP_PREFIX,
      backData: CALLBACK_DATA.REG_BACK_TO_SPEC,
      currentSelectionInfo: `📌 Курс: ${course}, специальность: ${specialization}`,
    });

    if (result === CANCEL_SYMBOL) return null;
    if (result === BACK_SYMBOL) return null;
    return result as string;
  }

  private async promptForSelection(
    params: SelectionPromptParams,
  ): Promise<SelectionResult> {
    const {
      conversation,
      ctx,
      step,
      totalSteps,
      promptPrefix,
      fetchItems,
      callbackPrefix,
      backData,
      currentSelectionInfo,
    } = params;

    const items = await fetchItems();
    const itemNames = items.map((item) => item.name);

    const keyboard = new InlineKeyboard();
    itemNames.forEach((name, index) => {
      keyboard.text(name, `${callbackPrefix}:${index}`).row();
    });

    if (backData) {
      keyboard.text("🔙 Назад", backData);
    }
    keyboard.text("❌ Отмена", CALLBACK_DATA.REG_CANCEL);

    const header = currentSelectionInfo ? `${currentSelectionInfo}\n` : "";
    const message = `${header}Шаг ${step}/${totalSteps}: ${promptPrefix}`;

    await sendOrEditMessage(ctx, message, { keyboard, conversation });

    const waitPatterns: (string | RegExp)[] = [
      new RegExp(`^${callbackPrefix}:`),
      CALLBACK_DATA.REG_CANCEL,
    ];
    if (backData) {
      waitPatterns.push(backData);
    }

    const responseCtx = await conversation.waitForCallbackQuery(waitPatterns);
    const data = responseCtx.callbackQuery.data;

    if (data === CALLBACK_DATA.REG_CANCEL) {
      await responseCtx.answerCallbackQuery();
      return CANCEL_SYMBOL;
    }

    if (backData && data === backData) {
      await responseCtx.answerCallbackQuery();
      return BACK_SYMBOL;
    }

    const index = parseInt(data.split(":")[2]);
    const selectedValue = itemNames[index];
    await responseCtx.answerCallbackQuery({
      text: `Выбрано: ${selectedValue}`,
    });
    return selectedValue;
  }

  private async cancel(
    ctx: Context,
    conversation: MyConversation,
  ): Promise<void> {
    await sendOrEditMessage(ctx, "❌ Регистрация отменена.", {
      conversation,
      keyboard: mainMenuKeyboard(),
    });
  }
}
