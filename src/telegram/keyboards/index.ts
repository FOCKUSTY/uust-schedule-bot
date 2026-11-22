import { InlineKeyboard } from "grammy";
import { CALLBACK_DATA } from "../callback-data";
import { CONFIG_ACTION } from "@/constants";

export const mainMenuKeyboard = () => {
  return new InlineKeyboard()
    .text("📅 Сегодня", CALLBACK_DATA.MENU_TODAY)
    .text("📆 Завтра", CALLBACK_DATA.MENU_TOMORROW)
    .row()
    .text("🗓 На неделю", CALLBACK_DATA.MENU_WEEK)
    .row()
    .text("⬅️ Пред. неделя", CALLBACK_DATA.SCHEDULE_WEEK_PREV)
    .text("➡️ След. неделя", CALLBACK_DATA.SCHEDULE_WEEK_NEXT)
    .row()
    .text("🔄 Сменить группу", CALLBACK_DATA.SCHEDULE_SWITCH_GROUP)
    .row()
    .text("⚙️ Настройки", CALLBACK_DATA.MENU_SETTINGS);
};

export const backButton = (text = "🔙 Назад") =>
  InlineKeyboard.text(text, CALLBACK_DATA.REG_BACK_TO_COURSE);

export const configSelectionKeyboard = (
  configs: Array<{
    id: number;
    course: string;
    specialization: string;
    group: string;
    actived: boolean;
    defaulted: boolean;
  }>,
) => {
  const keyboard = new InlineKeyboard();

  configs.forEach((config) => {
    const symbol = config.defaulted ? "💟" : config.actived ? "✅" : "◻️";

    keyboard
      .text(
        symbol,
        `${CALLBACK_DATA.SELECT_CONFIG}:${config.id}:${CONFIG_ACTION.ACTIVE}`,
      )
      .text(
        config.group,
        `${CALLBACK_DATA.SELECT_CONFIG}:${config.id}:${CONFIG_ACTION.DEFAULT}`,
      )
      .text("❌", `${CALLBACK_DATA.DELETE_CONFIG_PREFIX}:${config.id}`)
      .row();
  });

  keyboard.text("➕ Добавить группу", CALLBACK_DATA.MENU_ADD_GROUP);
  keyboard.text("🔙 Назад", CALLBACK_DATA.MENU_BACK);
  return keyboard;
};

/**
 * Главное меню настроек
 */
export const settingsMenuKeyboard = () => {
  return new InlineKeyboard()
    .text("👥 Выбрать подгруппы", CALLBACK_DATA.SETTINGS_SUBGROUPS)
    .text("🔙 Назад", CALLBACK_DATA.MENU_BACK);
};

/**
 * Клавиатура выбора подгрупп для каждой группы
 */
export const subgroupSettingsKeyboard = (
  configs: Array<{
    id: number;
    group: string;
    subgroup?: string | null;
  }>,
) => {
  const keyboard = new InlineKeyboard();

  configs.forEach((config) => {
    keyboard.text(`📚 ${config.group}`, "noop").row();

    const is1 = config.subgroup === "1";
    const is2 = config.subgroup === "2";
    const isNone = !config.subgroup;

    keyboard
      .text(
        is1 ? "✅ 1 п/п" : "1 п/п",
        `${CALLBACK_DATA.SETTINGS_SUBGROUP_SELECT}:${config.id}:1`,
      )
      .text(
        is2 ? "✅ 2 п/п" : "2 п/п",
        `${CALLBACK_DATA.SETTINGS_SUBGROUP_SELECT}:${config.id}:2`,
      )
      .text(
        isNone ? "✅ Без п/п" : "Без п/п",
        `${CALLBACK_DATA.SETTINGS_SUBGROUP_SELECT}:${config.id}:none`,
      )
      .row();
  });

  keyboard.text("🔙 Назад", CALLBACK_DATA.SETTINGS_BACK_TO_MENU);
  return keyboard;
};
