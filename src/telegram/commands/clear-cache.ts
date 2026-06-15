import type { Context } from "../bot";

import { readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { StringBuilder } from "../utils/string-builder";
import { env } from "../../env";

export const clearCache = (ctx: Context) => {
  if (ctx.from?.id !== env.BOT_CREATOR_ID) {
    return ctx.reply("Нет прав");
  }

  const cachePath = join(process.cwd(), "cache");

  const files = readdirSync(cachePath);
  for (const file of files) {
    writeFileSync(join(cachePath, file), "{}");
  }

  const builder = new StringBuilder().code(
    JSON.stringify(
      {
        text: "Очищены следующие файлы",
        files,
      },
      undefined,
      2,
    ),
  );

  return ctx.reply(builder.toString());
};
