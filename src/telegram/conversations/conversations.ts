import { Conversation } from "@/interfaces";

import { RegistrationConversation } from "./registration.conversation";
import { ScheduleConversation } from "./schedule.conversation";
import { GroupsScheduleConversation } from "./groups-schedule.conversation";

export const CONVERSATIONS: [string, Conversation][] = (() => {
  return [
    [RegistrationConversation.name, new RegistrationConversation()],
    [ScheduleConversation.name, new ScheduleConversation()],
    [GroupsScheduleConversation.name, new GroupsScheduleConversation()],
  ] as [string, Conversation][];
})();
