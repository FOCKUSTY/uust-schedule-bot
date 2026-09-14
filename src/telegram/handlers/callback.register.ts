import type {
  CallbackHandler,
  CallbackHandlerModule,
  CallbackMatcher,
  Context,
} from "@/types";

export class CallbackRegister {
  private readonly _exact = new Map<string, CallbackHandler>();
  private readonly _matchers: CallbackMatcher[] = [];

  public add(
    ...handlers: (new (register: CallbackRegister) => CallbackHandlerModule)[]
  ) {
    handlers.forEach((handler) => {
      new handler(this).execute();
    });
  }

  public exact(data: string, handler: CallbackHandler): this {
    this._exact.set(data, handler);
    return this;
  }

  public matcher(matcher: CallbackMatcher): this {
    this._matchers.push(matcher);
    return this;
  }

  public async dispatch(ctx: Context): Promise<unknown> {
    const data = ctx.callbackQuery?.data;
    if (!data) {
      return;
    }

    const exact = this._exact.get(data);
    if (exact) {
      return exact(ctx);
    }

    for (const matcher of this._matchers) {
      if (matcher.verify(data)) {
        return matcher.handle(ctx);
      }
    }

    return ctx.answerCallbackQuery("Неизвестное действие").catch(console.error);
  }
}
