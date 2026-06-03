import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatsService } from '../chats/chats.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private chatsService: ChatsService) {}

  // Se ejecutan cuando alguien se conecta o desconecta
  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { senderId: string; receiverId?: string; groupId?: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.chatsService.sendMessage(
      data.senderId,
      data.receiverId || '',
      data.content,
      data.groupId,
    );

    const fullMessage = await this.chatsService.getMessageWithSender(message.id);
    this.server.emit('newMessage', fullMessage);
    return fullMessage;
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom( // Permite a cada usuario unirse a su propia sala para recibir mensajes dirigidos solo a él
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(userId);
    console.log(`Usuario ${userId} se unió a su sala`);
  }

  @SubscribeMessage('addReaction')
  handleReaction(
    @MessageBody() data: { messageId: string; emoji: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.emit('reactionAdded', data);
  }
}