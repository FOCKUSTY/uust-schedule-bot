import {
  RegistrationConversation,
  ScheduleConversation,
} from "../conversations";
import { sendOrEditMessage } from "../utils";
import { configSelectionKeyboard } from "../keyboards";
import { Context } from "@/types";
import { UserService } from "@/database";

const userService = new UserService();

export const start = async (ctx: Context) => {
  const id = ctx.from?.id;
  if (!id) {
    throw new Error("id is not defined.");
  }

  const configs = await userService.getUserConfigs(id);
  if (configs.length === 0) {
    return ctx.conversation.enter(RegistrationConversation.name);
  }

  const activeConfigs = configs.filter(({ actived }) => actived);
  if (activeConfigs.length === 0) {
    return sendOrEditMessage(ctx, "Выберите группу", {
      keyboard: configSelectionKeyboard(configs),
    });
  }

  return ctx.conversation.enter(ScheduleConversation.name);
};
