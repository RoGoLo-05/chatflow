import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ChatsService } from './chats.service';

@Controller('chats')
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Post('send') //Enviar un mensaje
  sendMessage(
    @Body() body: { senderId: string; receiverId: string; content: string },
  ) {
    return this.chatsService.sendMessage(
      body.senderId,
      body.receiverId,
      body.content,
    );
  }

  @Get('conversation/:userId1/:userId2') //Ver conversación entre dos usuarios
  getConversation(
    @Param('userId1') userId1: string,
    @Param('userId2') userId2: string,
  ) {
    return this.chatsService.getConversation(userId1, userId2);
  }

  @Get('my/:userId') // Ver todas las conversaciones de un usuario
  getMyConversations(@Param('userId') userId: string) {
    return this.chatsService.getMyConversations(userId);
  }

  @Post('groups/create')
  createGroup(@Body() body: { name: string; creatorId: string }) {
    return this.chatsService.createGroup(body.name, body.creatorId);
  }

  @Post('groups/add-member')
  addMember(@Body() body: { groupId: string; userId: string }) {
    return this.chatsService.addMemberToGroup(body.groupId, body.userId);
  }

  @Post('groups/send')
  sendGroupMessage(
    @Body() body: { senderId: string; groupId: string; content: string },
  ) {
    return this.chatsService.sendGroupMessage(
      body.senderId,
      body.groupId,
      body.content,
    );
  }

  @Get('groups/:groupId/messages')
  getGroupMessages(@Param('groupId') groupId: string) {
    return this.chatsService.getGroupMessages(groupId);
  }

  @Get('groups/user/:userId')
  getUserGroups(@Param('userId') userId: string) {
    return this.chatsService.getUserGroups(userId);
  }
}