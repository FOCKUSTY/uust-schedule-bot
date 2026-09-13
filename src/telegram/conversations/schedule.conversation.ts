import { AparkitSchedule } from "@/classes";
import { UserService } from "@/database";
import { Conversation } from "@/interfaces";
import { MyConversation, Context } from "@/types";
import { getWeekendText, sendOrEditMessage } from "../utils";
import { configSelectionKeyboard } from "../keyboards";
import { WEEKEND } from "@/constants";

export class ScheduleConversation implements Conversation {
  private readonly _schedule: AparkitSchedule = new AparkitSchedule();
  private readonly _user_service: UserService = new UserService();

  public constructor() {}

  public async execute(
    conversation: MyConversation,
    ctx: Context,
  ): Promise<void> {
    const session = await conversation.external(({ session }) => session);
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      throw new Error("id is not defined.");
    }

    const configs = await this._user_service.getActiveConfigs(telegramId);
    const defaultConfig = configs.find((config) => config.defaulted);

    if (configs.length === 0 || !defaultConfig) {
      return sendOrEditMessage(ctx, "Выберите группу", {
        keyboard: configSelectionKeyboard(configs),
        conversation,
      });
    }

    const weekNumber = await this._schedule.api.getCurrentWeek();
    const dayNumber = await this._schedule.api.getCurrentDay();
    if (dayNumber === WEEKEND) {
      const text = getWeekendText({
        dayNumber,
        weekNumber,
        group: defaultConfig,
      });

      return sendOrEditMessage(ctx, text, { conversation });
    }
  }
}
