import type { GroupInformation } from "../schedule";
import { Prisma } from "./prisma";

type TelegramId = number | string;

export class UserService {
  private static readonly includeData = {
    userConfigs: {
      include: {
        config: true,
      },
    },
  };

  public constructor(public readonly prisma: Prisma = new Prisma()) {}

  public async findOrCreate(telegramId: TelegramId) {
    const id = telegramId.toString();
    const user = await this.prisma.user.findUnique({
      where: { telegramId: id },
      include: UserService.includeData,
    });

    if (user) {
      return user;
    }

    return this.prisma.user.create({
      data: { telegramId: id },
      include: UserService.includeData,
    });
  }

  public async getUserConfigs(telegramId: TelegramId) {
    const user = await this.findOrCreate(telegramId);
    return user.userConfigs.map(({ config, isActived, isDefault }) => ({
      ...config,
      isActived,
      isDefault,
    }));
  }

  public async getActiveConfigs(telegramId: TelegramId) {
    const configs = await this.getUserConfigs(telegramId);
    return configs.filter((config) => config.isActived);
  }

  public async addConfig(
    telegramId: TelegramId,
    config: GroupInformation,
    setAsDefault: boolean = true,
  ) {
    const user = await this.findOrCreate(telegramId);
    const newConfig = await this.prisma.config.create({ data: config });

    if (setAsDefault) {
      await this.prisma.userConfig.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    await this.prisma.userConfig.create({
      data: {
        userId: user.id,
        configId: newConfig.id,
        isActived: true,
        isDefault: setAsDefault,
      },
    });

    return newConfig;
  }

  public async deleteConfig(telegramId: TelegramId, configId: number) {
    const user = await this.findOrCreate(telegramId);
    const { where } = this.getWhereUserIdConfigId(user.id, configId);

    const userConfig = await this.prisma.userConfig.findUnique({ where });
    if (!userConfig) {
      return;
    }

    await this.prisma.userConfig.delete({ where });

    if (userConfig.isActived) {
      await this.activateFirstUserConfig(user.id);
    }
  }

  public async toggleConfigActive(telegramId: TelegramId, configId: number) {
    const user = await this.findOrCreate(telegramId);
    const { where } = this.getWhereUserIdConfigId(user.id, configId);

    const config = await this.prisma.userConfig.findUnique({ where });
    if (!config) {
      throw new Error("Config not found");
    }

    return this.prisma.userConfig.update({
      where,
      data: {
        isActived: !config.isActived,
      },
    });
  }

  public async toggleDefaultConfig(telegramId: TelegramId, configId: number) {
    const user = await this.findOrCreate(telegramId);
    const { where } = this.getWhereUserIdConfigId(user.id, configId);

    const userConfig = await this.prisma.userConfig.findUnique({ where });
    if (!userConfig) {
      throw new Error("Config not found");
    }

    if (userConfig.isDefault) {
      return this.setDefaultConfigDisabled(telegramId, configId);
    }

    return this.setDefaultConfigEnabled(telegramId, configId);
  }

  public async setDefaultConfigEnabled(
    telegramId: TelegramId,
    configId: number,
  ) {
    const user = await this.findOrCreate(telegramId);
    return this.prisma.$transaction([
      this.prisma.userConfig.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      }),
      this.prisma.userConfig.update({
        ...this.getWhereUserIdConfigId(user.id, configId),
        data: {
          isDefault: true,
          isActived: true,
        },
      }),
    ]);
  }

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
        isDefault: true,
        isActived: true,
      },
    });
  }

  private getWhereUserIdConfigId(userId: number, configId: number) {
    return {
      where: {
        userId_configId: {
          userId,
          configId,
        },
      },
    };
  }
}
