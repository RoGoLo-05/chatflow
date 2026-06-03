import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Busca usuarios cuyo username contenga el texto buscado, sin importar mayúsculas o minúsculas
  async searchUsers(username: string) {
    return this.prisma.user.findMany({
      where: {
        username: {
          contains: username,
          mode: 'insensitive',
        },
      },
      // Indica qué campos devolvemos — nunca devolvemos la contraseña
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });
  }

  // Busca un usuario por su id
  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });
  }
}