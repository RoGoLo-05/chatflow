import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  // Crea un mensaje nuevo entre dos usuarios
  async sendMessage(senderId: string, receiverId: string, content: string, groupId?: string) {
    return this.prisma.message.create({
      data: {
        content,
        senderId,
        receiverId: receiverId || null,
        groupId: groupId || null,
      },
    });
  }

  // Devuelve todos los mensajes entre dos usuarios ordenados por fecha
  async getConversation(userId1: string, userId2: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  // Devuelve la lista de conversaciones del usuario actual
  async getMyConversations(userId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: {
        createdAt: 'desc',
      },
      distinct: ['senderId', 'receiverId'],
      include: {
        sender: {
          select: { id: true, username: true },
        },
      },
    });
  }

  async createGroup(name: string, creatorId: string) {
    const group = await this.prisma.group.create({
      data: { name },
    });

    await this.prisma.groupMember.create({
      data: { groupId: group.id, userId: creatorId },
    });

    return group;
  }

  async addMemberToGroup(groupId: string, userId: string) {
    return this.prisma.groupMember.create({
      data: { groupId, userId },
    });
  }

  async sendGroupMessage(senderId: string, groupId: string, content: string) {
    return this.prisma.message.create({
      data: { content, senderId, groupId },
    });
  }

  async getGroupMessages(groupId: string) {
    return this.prisma.message.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, username: true },
        },
      },
    });
  }

  async getUserGroups(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId },
      include: { group: true },
    });
    return memberships.map(m => m.group);
  }

  async getMessageWithSender(messageId: string) {
    return this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: { id: true, username: true },
        },
      },
    });
  }
}