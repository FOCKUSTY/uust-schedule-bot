import { DateCalculator } from "@/telegram/utils/date-calculator";

export abstract class BaseApi {
  public async getCurrentDay() {
    const now = new Date();
    const day = now.getUTCDay() === 0 ? 7 : now.getUTCDay();
    return day;
  }

  public async getCurrentWeek() {
    return new DateCalculator().getCurrentWeek();
  }
}
