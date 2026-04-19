import type { Context, MyConversation } from "../bot";

import { InlineKeyboard } from "grammy";
import { mainMenuKeyboard } from "../keyboards";
import { Schedule } from "../../schedule";
import { UserService } from "../../database/user.service";
import { sendOrEditMessage } from "../utils/send-or-edit";

export const REGISTRATION_CONVERSATION = 'registration';
const userService = new UserService();

const BACK_SYMBOL = Symbol('back');
const CANCEL_SYMBOL = Symbol('cancel');

type SelectionResult = string | typeof BACK_SYMBOL | typeof CANCEL_SYMBOL;

interface PromptForSelectionParams {
  conversation: MyConversation;
  interaction: Context;
  step: number;
  totalSteps: number;
  promptPrefix: string;
  fetchItems: () => Promise<{ name: string }[]>;
  callbackPrefix: string;
  backData?: string;
  currentSelectionInfo?: string;
}

const buildSelectionKeyboard = (
  items: string[],
  prefix: string,
  includeBack: boolean,
  backData?: string
): InlineKeyboard => {
  const keyboard = new InlineKeyboard();
  items.forEach((name, index) => keyboard.text(name, `${prefix}:${index}`).row());
  
  if (includeBack) {
    keyboard.text('🔙 Назад', backData);
  }

  keyboard.text('❌ Отмена', 'reg:cancel');
  return keyboard;
}

const promptForSelection = async (
  params: PromptForSelectionParams
): Promise<SelectionResult> => {
  const {
    conversation,
    interaction,
    step,
    totalSteps,
    promptPrefix,
    fetchItems,
    callbackPrefix,
    backData,
    currentSelectionInfo,
  } = params;

  const items = await fetchItems();
  const itemNames = items.map(item => item.name);

  const keyboard = buildSelectionKeyboard(
    itemNames,
    callbackPrefix,
    Boolean(backData),
    backData
  );

  const header = currentSelectionInfo ? `${currentSelectionInfo}\n` : '';
  const message = `${header}Шаг ${step}/${totalSteps}: ${promptPrefix}`;

  await sendOrEditMessage(interaction, message, { keyboard, conversation });

  const waitPatterns: (string | RegExp)[] = [new RegExp(`^${callbackPrefix}:`), 'reg:cancel'];
  if (backData) {
    waitPatterns.push(backData);
  }

  const context = await conversation.waitForCallbackQuery(waitPatterns);
  const data = context.callbackQuery.data;

  if (data === 'reg:cancel') {
    await context.answerCallbackQuery();
    return CANCEL_SYMBOL;
  }

  if (backData && data === backData) {
    await context.answerCallbackQuery();
    return BACK_SYMBOL;
  }

  const index = parseInt(data.split(':')[2]);
  const selectedValue = itemNames[index];
  await context.answerCallbackQuery({ text: `Выбрано: ${selectedValue}` });
  return selectedValue;
}

export const registrationConversation = async (
  conversation: MyConversation,
  interaction: Context
): Promise<unknown> => {
  const telegramId = interaction.from!.id;

  let course: string | null = null;
  let specialization: string | null = null;
  let group: string | null = null;

  while (!course) {
    const result = await promptForSelection({
      conversation,
      interaction,
      step: 1,
      totalSteps: 3,
      promptPrefix: 'выберите курс',
      fetchItems: () => Schedule.getCourses(),
      callbackPrefix: 'reg:course',
    });

    if (result === CANCEL_SYMBOL) {
      return await sendOrEditMessage(interaction, '❌ Регистрация отменена.', { conversation });
    }

    course = result as string;
  }

  while (!specialization) {
    const result = await promptForSelection({
      conversation,
      interaction,
      step: 2,
      totalSteps: 3,
      promptPrefix: 'выберите специальность',
      fetchItems: () => Schedule.getSpecializations({ course: course! }),
      callbackPrefix: 'reg:spec',
      backData: 'reg:back_to_course',
      currentSelectionInfo: `📖 Курс: ${course}`,
    });

    if (result === CANCEL_SYMBOL) {
      return await sendOrEditMessage(interaction, '❌ Регистрация отменена.', { conversation });
    }

    if (result === BACK_SYMBOL) {
      course = null;
      continue;
    }

    specialization = result as string;
  }

  while (!group) {
    const result = await promptForSelection({
      conversation,
      interaction,
      step: 3,
      totalSteps: 3,
      promptPrefix: 'выберите группу',
      fetchItems: () => Schedule.getGroups({ course: course!, specialization: specialization! }),
      callbackPrefix: 'reg:group',
      backData: 'reg:back_to_spec',
      currentSelectionInfo: `📌 Курс: ${course}, специальность: ${specialization}`,
    });

    if (result === CANCEL_SYMBOL) {
      return await sendOrEditMessage(interaction, '❌ Регистрация отменена.', { conversation });
    }

    if (result === BACK_SYMBOL) {
      specialization = null;
      continue;
    }
    
    group = result;
  }

  await userService.addConfig(telegramId, {
    course: course!,
    specialization: specialization!,
    group: group!
  }, true);
  
  await sendOrEditMessage(
    interaction,
    `✅ Группа «${group}» сохранена и выбрана как активная!`,
    { keyboard: mainMenuKeyboard(), conversation }
  );
};