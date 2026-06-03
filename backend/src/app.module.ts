import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatsModule } from './chats/chats.module';
import { ChatGateway } from './chat/chat.gateway';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, ChatsModule],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
})
export class AppModule {}