import { InlineKeyboard } from "grammy";
import { CALLBACK_DATA } from "../constants/callback-data";

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
    .text("🔄 Сменить группу", CALLBACK_DATA.MENU_SWITCH_GROUP)
    .row()
    .text("⚙️ Настройки", "menu:settings");
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
      .text(symbol, `${CALLBACK_DATA.SELECT_CONFIG}:${config.id}:active`)
      .text(config.group, `${CALLBACK_DATA.SELECT_CONFIG}:${config.id}:default`)
      .text("❌", `delete_config:${config.id}`)
      .row();
  });

  keyboard.text("➕ Добавить группу", CALLBACK_DATA.MENU_ADD_GROUP);
  keyboard.text("🔙 Назад", CALLBACK_DATA.MENU_BACK);
  return keyboard;
};