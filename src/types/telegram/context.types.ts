import type { Context as GrammyContext, SessionFlavor } from "grammy";
import type { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import type { SessionData } from "./session.types";

export type Context = SessionFlavor<SessionData> &
  ConversationFlavor<GrammyContext>;
export type MyConversation = Conversation<Context, Context>;

export type CallbackHandler = (context: Context) => Promise<unknown>;

export type CallbackMatcher = {
  verify(data: string): boolean;
  handle(context: Context): Promise<unknown>;
};

export type CallbackHandlerModule = {
  execute(): void;
};
