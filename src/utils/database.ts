import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

class DatabaseManager {
  private static instance: DatabaseManager;
  public prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('Successfully connected to database');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('Disconnected from database');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
    }
  }

  // User methods
  public async getUser(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  public async createUser(userId: string, username: string) {
    return await this.prisma.user.create({
      data: {
        id: userId,
        username,
      },
    });
  }

  public async setAfk(userId: string, username: string, message: string) {
    return await this.prisma.user.upsert({
      where: { id: userId },
      update: {
        afkMessage: message,
        afkTimestamp: new Date(),
      },
      create: {
        id: userId,
        username,
        afkMessage: message,
        afkTimestamp: new Date(),
      },
    });
  }

  public async removeAfk(userId: string) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        afkMessage: null,
        afkTimestamp: null,
      },
    });
  }

  // Guild methods
  public async getGuild(guildId: string) {
    return await this.prisma.guild.findUnique({
      where: { id: guildId },
    });
  }

  public async createGuild(guildId: string, prefix?: string) {
    return await this.prisma.guild.create({
      data: {
        id: guildId,
        prefix: prefix || ',,',
      },
    });
  }

  // Reminder methods
  public async createReminder(userId: string, guildId: string, message: string, remindAt: Date) {
    return await this.prisma.reminder.create({
      data: {
        userId,
        guildId,
        message,
        remindAt,
      },
    });
  }

  public async getExpiredReminders() {
    return await this.prisma.reminder.findMany({
      where: {
        remindAt: {
          lte: new Date(),
        },
      },
    });
  }

  public async deleteReminder(id: number) {
    return await this.prisma.reminder.delete({
      where: { id },
    });
  }

  // Voice channel methods
  public async createVoiceChannel(channelId: string, ownerId: string, guildId: string) {
    return await this.prisma.voiceChannel.create({
      data: {
        id: channelId,
        ownerId,
        guildId,
      },
    });
  }

  public async deleteVoiceChannel(channelId: string) {
    return await this.prisma.voiceChannel.delete({
      where: { id: channelId },
    });
  }

  public async getVoiceChannel(channelId: string) {
    return await this.prisma.voiceChannel.findUnique({
      where: { id: channelId },
    });
  }
}

export const db = DatabaseManager.getInstance();
