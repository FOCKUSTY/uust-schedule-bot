import { InlineKeyboard } from 'grammy';

export const mainMenuKeyboard = () => {
  return new InlineKeyboard()
    .text('📅 Сегодня', 'menu:today')
    .text('📆 Завтра', 'menu:tomorrow')
    .row()
    .text('🗓 На неделю', 'menu:week')
    .row()
    .text('⬅️ Пред. неделя', 'schedule:prev_week')
    .text('➡️ След. неделя', 'schedule:next_week')
    .row()
    .text('🔄 Сменить группу', 'menu:switch_group')
    .row()
    .text('⚙️ Настройки', 'menu:settings');
};

export const backButton = (text = '🔙 Назад') => InlineKeyboard.text(text, 'reg:back');

export const configSelectionKeyboard = (
  configs: Array<{ id: number; course: string; specialization: string; group: string; isActived: boolean, isDefault: boolean }>
) => {
  const keyboard = new InlineKeyboard();
  
  configs.forEach(config => {
    const symbol = (() => {
      if (config.isDefault) {
        return "💟";
      }

      if (config.isActived) {
        return "✅";
      }

      return "◻️";
    })();

    keyboard
      .text(symbol, `select_config:${config.id}:active`)
      .text(`${config.group}`, `select_config:${config.id}:default`)
      .text('❌', `delete_config:${config.id}`)
      .row();
  });

  keyboard.text('➕ Добавить группу', 'menu:add_group');
  keyboard.text('🔙 Назад', 'menu:back');
  return keyboard;
};