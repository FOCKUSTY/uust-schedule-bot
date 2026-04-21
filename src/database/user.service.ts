import type { GroupInformation } from "../schedule";

import { Prisma } from "./prisma";

type TelegramId = number | string;

/**
 * Сервис для работы с пользователями и их конфигурациями групп.
 */
export class UserService {
  private readonly includeData = {
    userConfigs: {
      include: {
        config: true,
      },
    },
  };

  public constructor(public readonly prisma: Prisma = new Prisma()) {}

  /**
   * Находит существующего пользователя по telegramId или создаёт нового.
   */
  public async findOrCreate(telegramId: TelegramId) {
    const id = telegramId.toString();
    const user = await this.prisma.user.findUnique({
      where: { telegramId: id },
      include: this.includeData,
    });

    if (user) {
      return user;
    }

    return this.prisma.user.create({
      data: { telegramId: id },
      include: this.includeData,
    });
  }

  /**
   * Возвращает все конфигурации пользователя (включая неактивные).
   */
  public async getUserConfigs(telegramId: TelegramId) {
    const user = await this.findOrCreate(telegramId);
    return user.userConfigs.map(({ config, actived, defaulted }) => ({
      ...config,
      actived,
      defaulted,
    }));
  }

  /**
   * Возвращает только активные конфигурации пользователя.
   */
  public async getActiveConfigs(telegramId: TelegramId) {
    const configs = await this.getUserConfigs(telegramId);
    return configs.filter((config) => config.actived);
  }

  /**
   * Добавляет новую конфигурацию группы для пользователя.
   * @param setAsDefault – если true, делает новую конфигурацию дефолтной.
   */
  public async addConfig(
    telegramId: TelegramId,
    config: GroupInformation,
    setAsDefault: boolean = true,
  ) {
    const user = await this.findOrCreate(telegramId);
    
    const existedConfig = (() => {
      let existedConfig: (GroupInformation & { id: number }) | null = null;
      
      user.userConfigs.forEach(({ config: userConfig }) => {
        const courseEquals = config.course === userConfig.course;
        const specializationEquals = config.specialization === userConfig.specialization;
        const groupEquals = config.group === userConfig.group;
        
        if (courseEquals && specializationEquals && groupEquals) {
          existedConfig = userConfig;
          return true;
        }

        return false;
      });

      return existedConfig as (GroupInformation & { id: number }) | null;
    })();
    
    const newConfig = existedConfig || await this.prisma.config.create({ data: config });

    if (setAsDefault) {
      await this.prisma.userConfig.updateMany({
        where: { userId: user.id },
        data: { defaulted: false },
      });
    }

    if (existedConfig) {
      await this.prisma.userConfig.update({
        where: {
          userId_configId: {
            configId: existedConfig.id,
            userId: user.id
          },
        },
        data: {
          actived: true,
          defaulted: setAsDefault
        }
      });

      return newConfig;
    }

    await this.prisma.userConfig.create({
      data: {
        userId: user.id,
        configId: newConfig.id,
        actived: true,
        defaulted: setAsDefault,
      },
    });

    return newConfig;
  }

  /**
   * Удаляет конфигурацию пользователя.
   */
  public async deleteConfig(telegramId: TelegramId, configId: number) {
    const user = await this.findOrCreate(telegramId);
    const where = { userId_configId: { userId: user.id, configId } };

    const userConfig = await this.prisma.userConfig.findUnique({ where });
    if (!userConfig) {
      return;
    }

    await this.prisma.userConfig.delete({ where });

    if (userConfig.actived) {
      await this.activateFirstUserConfig(user.id);
    }
  }

  /**
   * Переключает флаг активности конфигурации.
   */
  public async toggleConfigActive(telegramId: TelegramId, configId: number) {
    const user = await this.findOrCreate(telegramId);
    const where = { userId_configId: { userId: user.id, configId } };

    const config = await this.prisma.userConfig.findUnique({ where });
    if (!config) {
      throw new Error("Config not found");
    }

    return this.prisma.userConfig.update({
      where,
      data: { actived: !config.actived },
    });
  }

  /**
   * Переключает статус дефолтной конфигурации.
   */
  public async toggleDefaultConfig(telegramId: TelegramId, configId: number) {
    const user = await this.findOrCreate(telegramId);
    const where = { userId_configId: { userId: user.id, configId } };

    const userConfig = await this.prisma.userConfig.findUnique({ where });
    if (!userConfig) {
      throw new Error("Config not found");
    }

    if (userConfig.defaulted) {
      return this.setDefaultConfigDisabled(telegramId, configId);
    }

    return this.setDefaultConfigEnabled(telegramId, configId);
  }

  /**
   * Делает указанную конфигурацию дефолтной (и активной).
   */
  public async setDefaultConfigEnabled(
    telegramId: TelegramId,
    configId: number,
  ) {
    const user = await this.findOrCreate(telegramId);
    return this.prisma.$transaction([
      this.prisma.userConfig.updateMany({
        where: { userId: user.id },
        data: { defaulted: false },
      }),
      this.prisma.userConfig.update({
        where: { userId_configId: { userId: user.id, configId } },
        data: {
          defaulted: true,
          actived: true,
        },
      }),
    ]);
  }

  /**
   * Отключает дефолтный статус у конфигурации и назначает дефолтной другую.
   */
  public async setDefaultConfigDisabled(
    telegramId: TelegramId,
    configId: number,
  ) {
    const user = await this.findOrCreate(telegramId);
    const anotherConfig = await this.prisma.userConfig.findFirst({
      where: {
        userId: user.id,
        configId: { not: configId },
      },
    });

    if (!anotherConfig) {
      throw new Error(
        `Cannot disable default config ${configId}: no other configs exist.`,
      );
    }

    return this.setDefaultConfigEnabled(telegramId, anotherConfig.configId);
  }

  private async activateFirstUserConfig(userId: number) {
    const first = await this.prisma.userConfig.findFirst({
      where: { userId },
    });

    if (!first) {
      return;
    }

    return this.prisma.userConfig.update({
      where: {
        userId_configId: {
          userId,
          configId: first.configId,
        },
      },
      data: {
        defaulted: true,
        actived: true,
      },
    });
  }
}
