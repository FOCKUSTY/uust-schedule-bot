import type { CallbackHandlerModule, Context } from "@/types";
import { UserService } from "../../database";
import { sendOrEditMessage } from "../utils";
import { configSelectionKeyboard } from "../keyboards";
import { NavigationService } from "../services";
import { CALLBACK_DATA } from "../callback-data";
import {
  GroupsScheduleConversation,
  ScheduleConversation,
} from "../conversations";
import { CallbackRegister } from "./callback.register";
import { WATCH_TYPE } from "@/constants";

const OFFSET_CALLBACKS = [
  CALLBACK_DATA.SCHEDULE_WEEK_PREV,
  CALLBACK_DATA.SCHEDULE_WEEK_NEXT,
  CALLBACK_DATA.SCHEDULE_WEEK_RESET,
  CALLBACK_DATA.SCHEDULE_DAY_PREV,
  CALLBACK_DATA.SCHEDULE_DAY_NEXT,
  CALLBACK_DATA.SCHEDULE_DAY_RESET,
] as const;

export class ScheduleHandler implements CallbackHandlerModule {
  private readonly _navigation = new NavigationService();
  private readonly _user_service = new UserService();

  public constructor(private readonly registry: CallbackRegister) {}

  public execute() {
    this.registerOffsetHandlers();
    this.registerDayWeekSwitchHandlers();
    this.registerGroupSwitchHandlers();
  }

  private registerOffsetHandlers() {
    OFFSET_CALLBACKS.forEach((key) => {
      this.registry.exact(key, async (ctx) => {
        this._navigation.changeOrResetOffset(
          ctx.session,
          key.includes(":week:") ? WATCH_TYPE.WEEK : WATCH_TYPE.DAY,
          key.includes("reset") ? undefined : key.includes("next") ? 1 : -1,
        );
        return this.enterConversation(ctx);
      });
    });
  }

  private enterConversation(ctx: Context) {
    return ctx.conversation.enter(ScheduleConversation.name);
  }

  private registerDayWeekSwitchHandlers() {
    this.registry.exact(CALLBACK_DATA.SCHEDULE_SWITCH_TODAY, async (ctx) => {
      this._navigation.setWatchType(ctx.session, WATCH_TYPE.DAY);
      return this.enterConversation(ctx);
    });

    this.registry.exact(CALLBACK_DATA.SCHEDULE_SWITCH_TOWEEK, async (ctx) => {
      this._navigation.setWatchType(ctx.session, WATCH_TYPE.WEEK);
      return this.enterConversation(ctx);
    });

    this.registry.exact(CALLBACK_DATA.SCHEDULE_STANDART, async (ctx) => {
      return ctx.conversation.enter(ScheduleConversation.name);
    });
  }

  private registerGroupSwitchHandlers() {
    this.registry.exact(
      CALLBACK_DATA.SCHEDULE_PRINT_ALL_GROUPS,
      async (ctx) => {
        return ctx.conversation.enter(GroupsScheduleConversation.name);
      },
    );

    this.registry.exact(CALLBACK_DATA.SCHEDULE_SWITCH_GROUP, async (ctx) => {
      const telegramId = ctx.from?.id;
      if (!telegramId) {
        throw new Error("id is not defined.");
      }

      const configs = await this._user_service.getUserConfigs(telegramId);
      if (configs.length === 0) {
        return sendOrEditMessage(
          ctx,
          "У вас нет сохранённых групп. Начните регистрацию: /start",
          {},
        );
      }

      const keyboard = configSelectionKeyboard(configs);
      await sendOrEditMessage(
        ctx,
        "Выберите группу для активации или добавьте новую:",
        { keyboard },
      );

      return ctx.answerCallbackQuery();
    });
  }
}
