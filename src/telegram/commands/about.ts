import type { Context } from "../bot";
import { StringBuilder } from "../utils/string-builder";

export const about = async (ctx: Context) => {
  const builder = new StringBuilder();

  builder
    .bold("👨‍💻 О разработчике")
    .appendLine()
    .append(
      "Backend‑разработчик (Full Stack), фокус на высоконагруженные системы.",
    )
    .appendLine()
    .appendLine()
    .bold("🛠️ Стек технологий")
    .appendLine()
    .append("• TypeScript / JavaScript / Node.js / Python")
    .appendLine()
    .append("• NestJS, Express, Socket.io")
    .appendLine()
    .append("• PostgreSQL, MongoDB, Redis")
    .appendLine()
    .append("• React, Next.js, Tailwind, Vite")
    .appendLine()
    .append("• Docker, GitHub Actions, Sentry")
    .appendLine()
    .appendLine()
    .bold("📌 Ключевые проекты")
    .appendLine()
    .append("• ")
    .link(
      "https://github.com/Lazy-And-Focused/BAD-template",
      "BAD Architecture",
    )
    .append(" – продакшен‑готовый шаблон для NestJS")
    .appendLine()
    .append("• ")
    .link(
      "https://github.com/The-Void-Community/tvc-hat",
      "Real‑time мессенджер",
    )
    .append(" (NestJS + Socket.io + Next.js)")
    .appendLine()
    .append("• ")
    .link("https://github.com/The-Void-Community/tvuikit", "Кастомный UI‑кит")
    .append(" (React + Storybook)")
    .appendLine()
    .append("• ")
    .link("https://github.com/FOCKUSTY/fock-logger", "fock-logger")
    .append(" – структурированное логирование")
    .appendLine()
    .append("• ")
    .link("https://github.com/FOCKUSTY/fouter", "fouter")
    .append(" – декларативное API с type‑safety")
    .appendLine()
    .append("• ")
    .link("https://github.com/FOCKUSTY/fbit-field", "fbit-field")
    .append(" – работа с битовыми полями")
    .appendLine()
    .appendLine()
    .bold("🔗 Связь")
    .appendLine()
    .append("• Telegram: ")
    .link("https://t.me/fockusty", "@fockusty")
    .appendLine()
    .append("• GitHub: ")
    .link("https://github.com/FOCKUSTY", "FOCKUSTY")
    .appendLine()
    .append("• VK: ")
    .link("https://vk.com/fockusty", "fockusty")
    .appendLine()
    .append("• Discord: ")
    .code("#FOCKUSTY")
    .appendLine()
    .appendLine()
    .italic(
      "Бот с открытым исходным кодом. Если есть вопросы или предложения – пишите!",
    )
    .appendLine()
    .link(
      "https://github.com/FOCKUSTY/uust-schedule-bot",
      "Публичный репозиторий бота",
    );

  await ctx.reply(builder.toString(), {
    parse_mode: "HTML",
  });
};
