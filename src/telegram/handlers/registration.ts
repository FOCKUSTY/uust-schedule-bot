import { Conversation } from '@grammyjs/conversations';
import { InlineKeyboard } from 'grammy';
import { Context } from '../bot';
import { ScheduleService } from '../../services/schedule.service';
import { UserService } from '../../services/user.service';
import { mainMenuKeyboard } from '../keyboards';
import { sendOrEditMessage } from '../utils/messageHelper';

const scheduleService = new ScheduleService();
const userService = new UserService();

export async function registrationConversation(
  conversation: Conversation<Context>,
  ctx: Context
) {
  const telegramId = ctx.from!.id;

  // Шаг 1: курс
  const courses = await scheduleService.getCourses();
  const courseNames = courses.map(c => c.name);

  await sendOrEditMessage(
    ctx,
    '📚 Шаг 1/3: выберите курс.',
    buildKeyboard(courseNames, 'course')
  );

  const courseCtx = await conversation.waitForCallbackQuery(/^reg:course:/);
  const courseIdx = parseInt(courseCtx.callbackQuery.data.split(':')[2]);
  const course = courseNames[courseIdx];
  await courseCtx.answerCallbackQuery({ text: `Выбран курс: ${course}` });

  // Шаг 2: специальность
  const specs = await scheduleService.getSpecializations(course);
  const specNames = specs.map(s => s.name);

  await sendOrEditMessage(
    ctx,
    `📖 Курс: ${course}\nШаг 2/3: выберите специальность.`,
    buildKeyboard(specNames, 'spec', { back: 'course' })
  );

  const specCtx = await conversation.waitForCallbackQuery([/^reg:spec:/, 'reg:back_to_course', 'reg:cancel']);
  const specData = specCtx.callbackQuery.data;

  if (specData === 'reg:back_to_course') {
    await specCtx.answerCallbackQuery();
    return await registrationConversation(conversation, ctx);
  }
  if (specData === 'reg:cancel') {
    await specCtx.answerCallbackQuery();
    await sendOrEditMessage(ctx, '❌ Регистрация отменена.');
    return;
  }

  const specIdx = parseInt(specData.split(':')[2]);
  const specialization = specNames[specIdx];
  await specCtx.answerCallbackQuery({ text: `Выбрана специальность: ${specialization}` });

  // Шаг 3: группа
  const groups = await scheduleService.getGroups(course, specialization);
  const groupNames = groups.map(g => g.name);

  await sendOrEditMessage(
    ctx,
    `📌 Курс: ${course}\nСпециальность: ${specialization}\nШаг 3/3: выберите группу.`,
    buildKeyboard(groupNames, 'group', { back: 'spec' })
  );

  const groupCtx = await conversation.waitForCallbackQuery([/^reg:group:/, 'reg:back_to_spec', 'reg:cancel']);
  const groupData = groupCtx.callbackQuery.data;

  if (groupData === 'reg:back_to_spec') {
    await groupCtx.answerCallbackQuery();
    // Сохраняем курс в сессии для быстрого возврата
    //@ts-ignore
    conversation.session.registration = { step: 'specialization', course };
    return await registrationConversation(conversation, ctx);
  }
  if (groupData === 'reg:cancel') {
    await groupCtx.answerCallbackQuery();
    await sendOrEditMessage(ctx, '❌ Регистрация отменена.');
    return;
  }

  const groupIdx = parseInt(groupData.split(':')[2]);
  const group = groupNames[groupIdx];
  await groupCtx.answerCallbackQuery({ text: `Выбрана группа: ${group}` });

  await userService.addConfig(`${telegramId}`, { course, specialization, group }, true);

  await sendOrEditMessage(
    ctx,
    `✅ Группа «${group}» сохранена и выбрана как активная!`,
    mainMenuKeyboard()
  );
}

function buildKeyboard(
  items: string[],
  prefix: string,
  options?: { back?: 'course' | 'spec' }
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  items.forEach((item, index) => {
    keyboard.text(item, `reg:${prefix}:${index}`).row();
  });
  if (options?.back) {
    const backData = options.back === 'course' ? 'reg:back_to_course' : 'reg:back_to_spec';
    keyboard.text('🔙 Назад', backData);
  }
  keyboard.text('❌ Отмена', 'reg:cancel');
  return keyboard;
}