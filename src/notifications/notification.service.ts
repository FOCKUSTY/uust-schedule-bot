import type { Bot } from "grammy";
import type { GroupInformation } from "../schedule";
import type { Context } from "../telegram/bot";

import { UserService } from "../database/user.service";
import { InlineKeyboard } from "grammy";
import { CALLBACK_DATA } from "../telegram/constants/callback-data";
import { StringBuilder } from "../telegram/utils/string-builder";

export class NotificationService {
  public constructor(
    private readonly bot: Bot<Context>,
    private readonly userService: UserService,
  ) {}

  /**
   * Отправляет уведомление об обновлении расписания всем активным пользователям группы.
   */
  public async notifyGroupChange(group: GroupInformation): Promise<void> {
    // Получаем всех пользователей, у которых эта конфигурация активна
    const users = await this.userService.prisma.user.findMany({
      where: {
        userConfigs: {
          some: {
            actived: true,
            config: {
              course: group.course,
              specialization: group.specialization,
              group: group.group,
            },
          },
        },
      },
      select: { telegramId: true },
    });

    if (users.length === 0) {
      return;
    }

    const keyboard = new InlineKeyboard().text(
      "📅 Посмотреть",
      CALLBACK_DATA.MENU_TODAY,
    );

    const messageText = new StringBuilder()
      .append("🔄 Расписание группы ")
      .bold(group.group)
      .appendLine(" обновлено")
      .appendLine(`Курс: ${group.course}`)
      .append(`Специальность: ${group.specialization}`);

    const sendPromises = users.map((user) =>
      this.bot.api
        .sendMessage(user.telegramId, messageText.toString(), {
          parse_mode: "HTML",
          reply_markup: keyboard,
        })
        .catch((error) => {
          console.error(
            `Failed to send notification to ${user.telegramId}:`,
            error,
          );
        }),
    );

    await Promise.allSettled(sendPromises);
  }
}