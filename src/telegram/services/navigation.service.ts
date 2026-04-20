import type { SessionData } from "../session";

/**
 * Управляет смещениями недели и дня в сессии пользователя.
 */
export class NavigationService {
  public changeOrResetOffset(session: SessionData, type: "week"|"day", delta?: number) {
    if (!delta) {
      if (type === "week") {
        return this.resetWeekOffset(session);
      }

      return this.resetDayOffset(session);
    }

    if (type === "week") {
      return this.changeWeekOffset(session, delta);
    }

    return this.changeDayOffset(session, delta);
  }

  /**
   * Изменяет смещение недели на заданную величину.
   */
  public changeWeekOffset(session: SessionData, delta: number): void {
    session.currentWeekOffset = (session.currentWeekOffset || 0) + delta;
  }

  /**
   * Сбрасывает смещение недели.
   */
  public resetWeekOffset(session: SessionData): void {
    session.currentWeekOffset = 0;
  }

  /**
   * Изменяет смещение дня на заданную величину.
   */
  public changeDayOffset(session: SessionData, delta: number): void {
    session.currentDayOffset = (session.currentDayOffset || 0) + delta;
  }

  /**
   * Сбрасывает смещение дня.
   */
  public resetDayOffset(session: SessionData): void {
    session.currentDayOffset = 0;
  }

  /**
   * Устанавливает режим просмотра (день / неделя).
   */
  public setWatchType(session: SessionData, type: "day" | "week"): void {
    session.watchType = type;
  }
}
