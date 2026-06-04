import type { Context } from "../bot";
import { StringBuilder } from "../utils/string-builder";

const commands: Record<string, string> = {
  start: "начало работы, выбор группы, просмотр расписания",
  schedule: "показать расписание на текущий день/неделю",
  today: "расписание на сегодня",
  tomorrow: "расписание на завтра",
  help: "эта справка",
  about: "информация об авторе",
  clear: "сбросить настройки сессии",
  menu: "главное меню",
};

const adminCommands: Record<string, string> = {
  clearCache: "очистка кэша",
}

export const help = async (ctx: Context) => {
  const builder = new StringBuilder();

  builder
    .bold("📚 Справка по использованию бота")
    .appendLine()
    .appendLine()
    .bold("🔹 Основные команды")
    .appendLine();

  Object.keys(commands).forEach(name => {
    builder.append(`• /${name} – `).appendLine(commands[name]);
  });

  if (`${ctx.from?.id}` === "5233359942") {
    Object.keys(adminCommands).forEach(name => {
      builder.append(`• /${name} – `).appendLine(adminCommands[name]);
    })
  }

  builder.appendLine();

  builder
    .bold("🔸 Интерактивные кнопки")
    .appendLine()
    .append("• 📅 Сегодня / 📆 Завтра – быстрый просмотр")
    .appendLine()
    .append("• 🗓 На неделю – расписание на текущую неделю")
    .appendLine()
    .append("• ⬅️ / ➡️ – переключение недели или дня")
    .appendLine()
    .append("• 🔄 Сменить группу – выбор другой сохранённой группы")
    .appendLine()
    .append("• ➕ Добавить группу – регистрация новой группы")
    .appendLine()
    .append("• ✅ – активная группа (для деактивации нажать на этот значок)")
    .appendLine()
    .append("• ◻️ – неактивная группа (для активации нажать на этот значок)")
    .appendLine()
    .append(
      "• 💟 – показатель основной группы (для выбора основной группы нажать на название группы)",
    )
    .appendLine()
    .appendLine()
    .bold("ℹ️ Примечания")
    .appendLine()
    .append(
      "• Расписание обновляется автоматически при изменениях в Google Drive",
    )
    .appendLine()
    .append("• Если группа не выбрана – бот предложит выбрать из списка")
    .appendLine()
    .append("• Выходные дни отображаются как «Пар нет»")
    .appendLine()
    .append("• Для связи писать ")
    .link("https://t.me/fockusty", "@fockusty").appendLine()
    .appendLine("• Или мне в анонимку:")
    .append("  • ").link("https://t.me/fockusty_anon_bot", "лично")
    .appendLine()
    .append("  • ").link("https://t.me/thevanon_bot", "в канал");

  await ctx.reply(builder.toString(), {
    parse_mode: "HTML",
  });
};