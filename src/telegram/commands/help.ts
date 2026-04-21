import type { Context } from "../bot";
import { StringBuilder } from "../utils/string-builder";

export const help = async (ctx: Context) => {
  const builder = new StringBuilder();

  builder
    .bold("📚 Справка по использованию бота")
    .appendLine()
    .appendLine()
    .bold("🔹 Основные команды")
    .appendLine()
    .append("• /start – ")
    .append("начало работы, выбор группы, просмотр расписания")
    .appendLine()
    .append("• /schedule – ")
    .append("показать расписание на текущий день/неделю")
    .appendLine()
    .append("• /today – ")
    .append("расписание на сегодня")
    .appendLine()
    .append("• /tomorrow – ")
    .append("расписание на завтра")
    .appendLine()
    .append("• /help – ")
    .append("эта справка")
    .appendLine()
    .append("• /about – ")
    .append("информация об авторе")
    .appendLine()
    .appendLine()
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
    .link("https://t.me/fockusty", "@fockusty");

  await ctx.reply(builder.toString(), {
    parse_mode: "HTML",
  });
};
