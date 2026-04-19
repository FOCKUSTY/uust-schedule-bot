import type { GroupInformation } from "../schedule";
import type { GoogleDriveService } from "../schedule/google-drive.service";
import type { ScheduleCache } from "../schedule/schedule-cache";
import type { ScheduleLoader } from "../schedule/schedule-loader";
import type { NotificationService } from "../notifications/notification.service";

export interface WatcherOptions {
  intervalMs: number;
}

export class ScheduleWatcher {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  public constructor(
    private readonly driveService: GoogleDriveService,
    private readonly cache: ScheduleCache,
    private readonly loader: ScheduleLoader,
    private readonly notificationService: NotificationService,
    private readonly options: WatcherOptions,
  ) {}

  /**
   * Запускает периодическую проверку.
   */
  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.scheduleNextCheck();
  }

  /**
   * Останавливает проверку.
   */
  public stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  private scheduleNextCheck(): void {
    if (!this.isRunning) {
      return;
    }

    this.timer = setTimeout(async () => {
      await this.checkAllGroups();
      this.scheduleNextCheck();
    }, this.options.intervalMs);
  }

  /**
   * Проверяет все группы, присутствующие в кэше (секция default).
   */
  private async checkAllGroups(): Promise<void> {
    const groupKeys = this.cache.getAllCachedGroupKeys();
    for (const key of groupKeys) {
      const [course, specialization, groupName] = key.split(":");
      const group: GroupInformation = { course, specialization, group: groupName };
      await this.checkGroup(group);
    }
  }

  /**
   * Проверяет одну группу на наличие изменений.
   */
  private async checkGroup(group: GroupInformation): Promise<void> {
    const groupKey = `${group.course}:${group.specialization}:${group.group}`;
    const watcherData = this.cache.getWatcherData();
    const entry = watcherData[groupKey];

    let fileId: string;
    if (entry?.fileId) {
      fileId = entry.fileId;
    } else {
      try {
        const courseFolder = await this.driveService["findFolderByName"](
          this.driveService["rootFolderId"],
          group.course,
        );
        const fileInfo = await this.driveService["findFileByName"](
          courseFolder.id,
          group.specialization,
        );
        fileId = fileInfo.id;
      } catch (error) {
        console.error(`Failed to resolve fileId for group ${groupKey}:`, error);
        return;
      }
    }

    let fileInfo;
    try {
      fileInfo = await this.driveService["drive"].getFileInfo(fileId);
    } catch (error) {
      console.error(`Failed to fetch file info for ${fileId}:`, error);
      return;
    }

    const lastModified = fileInfo.modifiedTime;
    const nowISO = new Date().toISOString();

    this.cache.updateWatcherEntry(groupKey, {
      fileId,
      lastChecked: nowISO,
      ...(lastModified ? {} : { lastModified: "" }),
    });

    if (lastModified && entry?.lastModified && lastModified !== entry.lastModified) {
      console.log(`Schedule changed for group ${groupKey}, updating cache...`);
      try {
        const weeks = await this.loader.loadFullSchedule(group);
        this.cache.setWeeks(group, weeks);
        this.cache.updateWatcherEntry(groupKey, { lastModified });
        await this.cache.save();

        await this.notificationService.notifyGroupChange(group);
      } catch (error) {
        console.error(`Failed to update schedule for ${groupKey}:`, error);
      }
    } else if (lastModified && !entry?.lastModified) {
      this.cache.updateWatcherEntry(groupKey, { lastModified });
      await this.cache.save();
    }
  }
}