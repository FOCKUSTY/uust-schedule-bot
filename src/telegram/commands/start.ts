import { UserService } from "../../database/user.service";
import { Context } from "../bot";
import { REGISTRATION_CONVERSATION } from "../conversations/registration";
import { SCHEDULE_CONVERSATION } from "../conversations/schedule";
import { configSelectionKeyboard } from "../keyboards";
import { sendOrEditMessage } from "../utils/send-or-edit";

const userService = new UserService();

export const start = async (ctx: Context) => {
  const id = ctx.from?.id;
  if (!id) {
    throw new Error("id is not defined.");
  }

  const configs = await userService.getUserConfigs(id);
  if (configs.length === 0) {
    return ctx.conversation.enter(REGISTRATION_CONVERSATION);
  }

  const activeConfigs = configs.filter(({ actived }) => actived);
  if (activeConfigs.length === 0) {
    return sendOrEditMessage(ctx, "Выберите группу", {
      keyboard: configSelectionKeyboard(configs),
    });
  }

  return ctx.conversation.enter(SCHEDULE_CONVERSATION);
};