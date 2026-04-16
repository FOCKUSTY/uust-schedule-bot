import { Schedule } from '../schedule/schedule';
import type { GroupInformation, ScheduleWeeks } from '../schedule/types';
import { Cache } from '../schedule/cache';

export class ScheduleService {
  private cache: Cache;

  constructor() {
    this.cache = new Cache();
  }

  async getCourses() {
    return Schedule.getCourses();
  }

  async getSpecializations(course: string) {
    return Schedule.getSpecializations({ course });
  }

  async getGroups(course: string, specialization: string) {
    return Schedule.getGroups({ course, specialization });
  }

  async getScheduleForGroup(config: GroupInformation, week?: number) {
    const schedule = new Schedule(config, week);
    return schedule.execute();
  }

  async getScheduleForWeek(config: GroupInformation, week: number) {
    const schedule = new Schedule(config, week);

    await schedule.execute();
    await new Schedule(config, week).execute();

    return schedule.getFromCache() || (await schedule.execute());
  }

  async getFullWeeks(config: GroupInformation): Promise<ScheduleWeeks | null> {
    const schedule = new Schedule(config);
    await schedule.execute();
    return schedule.getFromCache() || null;
  }
}