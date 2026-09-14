import type { CallbackHandlerModule } from "@/types";
import { today, tomorrow } from "../commands";
import { mainMenuKeyboard } from "../keyboards";
import { sendOrEditMessage } from "../utils";
import { CALLBACK_DATA } from "../callback-data";
import {
  RegistrationConversation,
  ScheduleConversation,
} from "../conversations";
import { CallbackRegister } from "./callback.register";

const REGISTRATION_ACTIONS = [
  CALLBACK_DATA.MENU_SWITCH_GROUP,
  CALLBACK_DATA.MENU_ADD_GROUP,
] as const;

export class MenuHandler implements CallbackHandlerModule {
  public constructor(private readonly registry: CallbackRegister) {}

  public execute() {
    this.registerScheduleActions();
    this.registerRegistrationActions();
    this.registerBackAction();
  }

  private registerScheduleActions() {
    this.registry.exact(CALLBACK_DATA.MENU_WEEK, async (ctx) => {
      ctx.session.watchType = "week";
      return ctx.conversation.enter(ScheduleConversation.name);
    });

    this.registry.exact(CALLBACK_DATA.MENU_TODAY, today);
    this.registry.exact(CALLBACK_DATA.MENU_TOMORROW, tomorrow);
  }

  private registerRegistrationActions() {
    REGISTRATION_ACTIONS.forEach((key) => {
      this.registry.exact(key, async (ctx) => {
        await ctx.conversation.enter(RegistrationConversation.name);
        await ctx.answerCallbackQuery();
      });
    });
  }

  private registerBackAction() {
    this.registry.exact(CALLBACK_DATA.MENU_BACK, async (ctx) => {
      await sendOrEditMessage(ctx, "Главное меню", {
        keyboard: mainMenuKeyboard(),
      });
      return ctx.answerCallbackQuery();
    });
  }
}
