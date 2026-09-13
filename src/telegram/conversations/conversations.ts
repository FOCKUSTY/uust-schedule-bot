import { Conversation } from "@/interfaces";

import { RegistrationConversation } from "./registration.conversation";
import { ScheduleConversation } from "./schedule.conversation";

export const CONVERSATIONS: [string, Conversation][] = (() => {
  return [
    [RegistrationConversation.name, new RegistrationConversation()],
    [ScheduleConversation.name, new ScheduleConversation()],
  ] as [string, Conversation][];
})();
