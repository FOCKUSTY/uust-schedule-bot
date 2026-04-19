import { env } from "../env";
import { extractIdFromUrl } from "./google";
import { GoogleDriveService } from "./google-drive.service";
import { ScheduleCache } from "./schedule-cache";
import { ScheduleLoader } from "./schedule-loader";
import { GroupInformation, ScheduleWeek } from "./types";
import { WeekCalculator } from "./week-calculator";

/**
 * Основной класс для получения расписания.
 * Иммутабельный: при изменении параметров возвращает новый экземпляр.
 */
export class Schedule {
  private readonly loader: ScheduleLoader;
  private readonly cache: ScheduleCache;
  private readonly weekCalculator: WeekCalculator;

  /**
   * @param group Информация о группе
   * @param weekNumber Номер недели (0-based)
   * @param deps Зависимости (если не переданы, создаются с параметрами из env)
   */
  public constructor(
    public readonly group: GroupInformation,
    public readonly weekNumber: number,
    deps?: {
      loader?: ScheduleLoader;
      cache?: ScheduleCache;
      weekCalculator?: WeekCalculator;
    },
  ) {
    const rootFolderId = extractIdFromUrl(env.GOOGLE_DRIVE_FOLDER_URL);
    if (!rootFolderId) {
      throw new Error("Invalid GOOGLE_DRIVE_FOLDER_URL");
    }

    const driveService = new GoogleDriveService(rootFolderId);
    this.loader = deps?.loader ?? new ScheduleLoader(driveService);
    this.cache = deps?.cache ?? new ScheduleCache(process.cwd());
    this.weekCalculator = deps?.weekCalculator ?? new WeekCalculator(env.START_DATE);
  }

  /**
   * Инициализирует кэш (загружает данные из файла).
   * Должен быть вызван перед первым использованием.
   */
  public async initializeCache(): Promise<void> {
    await this.cache.load();
  }

  /**
   * Возвращает расписание на выбранную неделю.
   * При необходимости загружает из Drive и кэширует.
   */
  public async getWeekSchedule(): Promise<ScheduleWeek> {
    const cachedWeeks = this.cache.getWeeks(this.group);
    if (cachedWeeks) {
      const week = cachedWeeks[this.weekNumber];
      if (week) {
        return week;
      }
    }

    const weeks = await this.loader.loadFullSchedule(this.group);

    this.cache.setWeeks(this.group, weeks);
    await this.cache.save();

    const week = weeks[this.weekNumber];
    if (!week) {
      throw new Error(`Неделя ${this.weekNumber} отсутствует в расписании`);
    }

    return week;
  }

  /**
   * Создаёт новый экземпляр Schedule с другой неделей.
   */
  public withWeek(newWeek: number): Schedule {
    return new Schedule(this.group, newWeek, {
      loader: this.loader,
      cache: this.cache,
      weekCalculator: this.weekCalculator,
    });
  }

  /**
   * Создаёт новый экземпляр Schedule с другой группой.
   */
  public withGroup(newGroup: GroupInformation): Schedule {
    return new Schedule(newGroup, this.weekNumber, {
      loader: this.loader,
      cache: this.cache,
      weekCalculator: this.weekCalculator,
    });
  }

  /**
   * Возвращает сервис кэша (для продвинутого использования).
   */
  public getCache(): ScheduleCache {
    return this.cache;
  }

  /**
   * Возвращает сервис загрузки (для получения списков курсов и т.п.).
   */
  public getLoader(): ScheduleLoader {
    return this.loader;
  }

  /**
   * Возвращает калькулятор недель.
   */
  public getWeekCalculator(): WeekCalculator {
    return this.weekCalculator;
  }
}