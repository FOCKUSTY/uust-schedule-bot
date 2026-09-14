import type { Context, MyConversation } from "@/types";

export type Conversation = {
  execute(conversation: MyConversation, context: Context): Promise<void>;
};
