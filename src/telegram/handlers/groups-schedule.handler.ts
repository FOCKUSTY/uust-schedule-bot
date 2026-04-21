import type { Context } from "../bot";
import { CALLBACK_DATA } from "../constants/callback-data";
import { GROUPS_SCHEDULE_CONVERSATION } from "../conversations/groups-schedule";

export class GroupsScheduleHandler {
  public constructor() {}

  public verify(data: string): boolean;
  public verify(ctx: Context): boolean;
  public verify(ctx: Context | string): boolean {
    const callbackData =
      typeof ctx === "string" ? ctx : ctx.callbackQuery?.data!;
    const [data] = callbackData.split(":");
    if (data !== CALLBACK_DATA.GROUPS_SCHEDULE) {
      return false;
    }

    return true;
  }

  public handle(ctx: Context) {
    const data = ctx.callbackQuery?.data!;
    const [callbackData, group] = data.split(":");
    if (!this.verify(callbackData)) {
      return "NON";
    }

    ctx.session.last.quickConfigGroup = null;
    ctx.session.quickConfigGroup = group;

    return ctx.conversation.enter(GROUPS_SCHEDULE_CONVERSATION);
  }
}
