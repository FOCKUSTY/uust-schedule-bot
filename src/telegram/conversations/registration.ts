import type { Context, MyConversation } from "../bot";

import { UserService } from "../../database/user.service";
import { Schedule } from "../../schedule/schedule";
import { RegistrationWizard } from "./registration.wizard";

export const REGISTRATION_CONVERSATION = "registration";

const userService = new UserService();
const dummySchedule = new Schedule(
  { course: "", specialization: "", group: "" },
  0,
);

export const registrationConversation = async (
  conversation: MyConversation,
  ctx: Context,
): Promise<unknown> => {
  const wizard = new RegistrationWizard(userService, dummySchedule);
  return wizard.start(conversation, ctx);
};
