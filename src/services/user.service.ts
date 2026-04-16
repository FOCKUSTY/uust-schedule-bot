import { Prisma } from '../database/prisma';

const prisma = new Prisma();

export class UserService {
  async findOrCreateUser(telegramId: string) {
    const id = telegramId.toString();
    let user = await prisma.user.findUnique({
      where: { telegramId: id },
      include: {
        userConfigs: {
          include: { config: true },
        },
      },
    });
    if (!user) {
      user = await prisma.user.create({
        data: { telegramId: id },
        include: {
          userConfigs: {
            include: { config: true },
          },
        },
      });
    }
    return user;
  }

  async getUserConfigs(telegramId: string) {
    const user = await this.findOrCreateUser(telegramId);
    return user.userConfigs.map(uc => ({
      ...uc.config,
      isActived: uc.isActived,
      assignedAt: uc.assignedAt,
    }));
  }

  async getActiveConfig(telegramId: string) {
    const configs = await this.getUserConfigs(telegramId);
    return configs.find(c => c.isActived) || configs[0] || null;
  }

  async addConfig(
    telegramId: string,
    configData: { course: string; specialization: string; group: string },
    setAsActive: boolean = true
  ) {
    const user = await this.findOrCreateUser(telegramId);

    const newConfig = await prisma.config.create({
      data: configData,
    });

    if (setAsActive) {
      await prisma.userConfig.updateMany({
        where: { userId: user.id },
        data: { isActived: false },
      });
    }

    await prisma.userConfig.create({
      data: {
        userId: user.id,
        configId: newConfig.id,
        isActived: setAsActive,
      },
    });

    return newConfig;
  }

  async removeConfig(telegramId: string, configId: number) {
    const user = await this.findOrCreateUser(`${telegramId}`);
    const userConfig = await prisma.userConfig.findUnique({
      where: {
        userId_configId: { userId: user.id, configId },
      },
    });
    if (!userConfig) return;

    const wasActive = userConfig.isActived;
    await prisma.userConfig.delete({
      where: { userId_configId: { userId: user.id, configId } },
    });

    if (wasActive) {
      // Назначить первую попавшуюся конфигурацию активной
      const firstRemaining = await prisma.userConfig.findFirst({
        where: { userId: user.id },
      });
      if (firstRemaining) {
        await prisma.userConfig.update({
          where: {
            userId_configId: {
              userId: user.id,
              configId: firstRemaining.configId,
            },
          },
          data: { isActived: true },
        });
      }
    }
  }

  async setActiveConfig(telegramId: string, configId: number) {
    const user = await this.findOrCreateUser(telegramId);
    await prisma.$transaction([
      prisma.userConfig.updateMany({
        where: { userId: user.id },
        data: { isActived: false },
      }),
      prisma.userConfig.update({
        where: {
          userId_configId: {
            userId: user.id,
            configId,
          },
        },
        data: { isActived: true },
      }),
    ]);
  }
}