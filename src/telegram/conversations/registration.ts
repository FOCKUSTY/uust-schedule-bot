import type { Context, MyConversation } from "../bot";

import { UserService } from "../../database/user.service";
import { RegistrationWizard } from "./registration.wizard";

export const REGISTRATION_CONVERSATION = "registration";

const userService = new UserService();

export const registrationConversation = async (
  conversation: MyConversation,
  ctx: Context,
): Promise<unknown> => {
  const wizard = new RegistrationWizard(userService);
  return wizard.start(conversation, ctx);
};
