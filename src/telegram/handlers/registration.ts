// src/telegram/handlers/registration.ts
import { Conversation } from '@grammyjs/conversations';
import { InlineKeyboard } from 'grammy';
import { Context } from '../bot';
import { ScheduleService } from '../../services/schedule.service';
import { UserService } from '../../services/user.service';
import { mainMenuKeyboard } from '../keyboards';

const scheduleService = new ScheduleService();
const userService = new UserService();

export async function registrationConversation(
  conversation: Conversation<Context>,
  ctx: Context
) {
  const telegramId = ctx.from!.id;

  let course: string | undefined;
  let specialization: string | undefined;
  let group: string | undefined;

  // Шаг 1: курс
  const courses = await scheduleService.getCourses();
  const courseNames = courses.map(c => c.name);
  
  while (!course) {
    const keyboard = new InlineKeyboard();
    courseNames.forEach((name, idx) => keyboard.text(name, `reg:course:${idx}`).row());
    keyboard.text('❌ Отмена', 'reg:cancel');

    await ctx.reply('📚 Шаг 1/3: выберите курс.', { reply_markup: keyboard });

    const courseCtx = await conversation.waitForCallbackQuery(/^reg:course:/);
    const data = courseCtx.callbackQuery.data;
    if (data === 'reg:cancel') {
      await courseCtx.answerCallbackQuery();
      await ctx.reply('❌ Регистрация отменена.');
      return;
    }
    const idx = parseInt(data.split(':')[2]);
    course = courseNames[idx];
    await courseCtx.answerCallbackQuery({ text: `Выбран курс: ${course}` });
  }

  // Шаг 2: специальность
  const specializations = await scheduleService.getSpecializations(course);
  const specNames = specializations.map(s => s.name);
  
  while (!specialization) {
    const keyboard = new InlineKeyboard();
    specNames.forEach((name, idx) => keyboard.text(name, `reg:spec:${idx}`).row());
    keyboard.text('🔙 Назад', 'reg:back_to_course');
    keyboard.text('❌ Отмена', 'reg:cancel');

    await ctx.reply(`📖 Курс: ${course}\nШаг 2/3: выберите специальность.`, { reply_markup: keyboard });

    const specCtx = await conversation.waitForCallbackQuery([
      /^reg:spec:/,
      'reg:back_to_course',
      'reg:cancel',
    ]);
    const data = specCtx.callbackQuery.data;

    if (data === 'reg:back_to_course') {
      course = undefined;
      await specCtx.answerCallbackQuery();
      return await registrationConversation(conversation, ctx);
    } else if (data === 'reg:cancel') {
      await specCtx.answerCallbackQuery();
      await ctx.reply('❌ Регистрация отменена.');
      return;
    } else {
      const idx = parseInt(data.split(':')[2]);
      specialization = specNames[idx];
      await specCtx.answerCallbackQuery({ text: `Выбрана специальность: ${specialization}` });
    }
  }

  // Шаг 3: группа
  const groups = await scheduleService.getGroups(course, specialization);
  const groupNames = groups.map(g => g.name);
  
  while (!group) {
    const keyboard = new InlineKeyboard();
    groupNames.forEach((name, idx) => keyboard.text(name, `reg:group:${idx}`).row());
    keyboard.text('🔙 Назад', 'reg:back_to_spec');
    keyboard.text('❌ Отмена', 'reg:cancel');

    await ctx.reply(`📌 Курс: ${course}, специальность: ${specialization}\nШаг 3/3: выберите группу.`, {
      reply_markup: keyboard,
    });

    const groupCtx = await conversation.waitForCallbackQuery([
      /^reg:group:/,
      'reg:back_to_spec',
      'reg:cancel',
    ]);
    const data = groupCtx.callbackQuery.data;

    if (data === 'reg:back_to_spec') {
      specialization = undefined;
      await groupCtx.answerCallbackQuery();
      return await registrationConversation(conversation, ctx);
    } else if (data === 'reg:cancel') {
      await groupCtx.answerCallbackQuery();
      await ctx.reply('❌ Регистрация отменена.');
      return;
    } else {
      const idx = parseInt(data.split(':')[2]);
      group = groupNames[idx];
      await groupCtx.answerCallbackQuery({ text: `Выбрана группа: ${group}` });
    }
  }

  await userService.addConfig(`${telegramId}`, { course, specialization, group }, true);

  await ctx.reply(`✅ Группа «${group}» сохранена и выбрана как активная!`, {
    reply_markup: mainMenuKeyboard(),
  });
}