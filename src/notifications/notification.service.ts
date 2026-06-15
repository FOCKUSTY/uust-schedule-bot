import type { Bot } from "grammy";
import type {
  GroupInformation,
  ScheduleDay,
  WeekCalculator,
} from "../schedule";
import type { Context } from "../telegram/bot";

import { UserService } from "../database/user.service";
import { InlineKeyboard } from "grammy";
import { CALLBACK_DATA } from "../telegram/constants/callback-data";
import { StringBuilder } from "../telegram/utils/string-builder";
import { formatDay } from "../telegram/utils/format-schedule";

export class NotificationService {
  public constructor(
    private readonly bot: Bot<Context>,
    private readonly userService: UserService,
  ) {}

  /**
   * Отправляет уведомление об обновлении расписания всем активным пользователям группы.
   */
  public async notifyGroupChange({
    group,
    schedule,
    week,
    weekCalculator,
  }: {
    group: GroupInformation;
    schedule: ScheduleDay;
    week: number;
    weekCalculator: WeekCalculator;
  }): Promise<void> {
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

    const dayText = formatDay(schedule, week, weekCalculator);
    const keyboard = new InlineKeyboard();
    keyboard
      .text("⬅️", CALLBACK_DATA.SCHEDULE_DAY_PREV)
      .text(`📅 ${schedule.dayName}`, CALLBACK_DATA.SCHEDULE_DAY_RESET)
      .text("➡️", CALLBACK_DATA.SCHEDULE_DAY_NEXT)
      .row();
    keyboard.text("🗓 На неделю", CALLBACK_DATA.SCHEDULE_SWITCH_TOWEEK).row();

    keyboard.text("Обычное расписание", CALLBACK_DATA.SCHEDULE_STANDART).row();
    keyboard.text("В главное меню", CALLBACK_DATA.MENU_BACK).row();

    const text = new StringBuilder()
      .append(`Изменено расписание у ${group.group} `)
      .appendRawLine(dayText)
      .toString();

    const sendPromises = users.map((user) =>
      this.bot.api
        .sendMessage(user.telegramId, text, {
          reply_markup: keyboard,
          parse_mode: "HTML",
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
