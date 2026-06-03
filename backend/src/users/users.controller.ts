import { Controller, Get, Query, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // Busca usuarios por username
  @Get('search')
  searchUsers(@Query('username') username: string) {
    return this.usersService.searchUsers(username);
  }

  // Obtiene un usuario por su id
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }
}