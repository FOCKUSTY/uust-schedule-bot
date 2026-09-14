import type { CallbackHandlerModule, CallbackMatcher, Context } from "@/types";
import { CALLBACK_DATA } from "../callback-data";
import { CallbackRegister } from "./callback.register";
import { GroupsScheduleConversation } from "../conversations";

export class GroupsScheduleHandler
  implements CallbackMatcher, CallbackHandlerModule
{
  public constructor(private readonly registry: CallbackRegister) {}

  public execute() {
    this.registry.matcher(this);
  }

  public verify(data: string): boolean {
    const [prefix] = data.split(":");
    return prefix === CALLBACK_DATA.GROUPS_SCHEDULE;
  }

  public async handle(ctx: Context) {
    const data = ctx.callbackQuery?.data;
    if (!data) {
      return;
    }

    const [, group] = data.split(":");

    ctx.session.last.quickConfigGroup = null;
    ctx.session.quickConfigGroup = group;

    return ctx.conversation.enter(GroupsScheduleConversation.name);
  }
}
