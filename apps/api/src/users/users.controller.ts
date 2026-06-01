import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

class CreateUserDto {
  email: string;
  role: UserRole;
  organisationId?: string;
}

class UpdateRoleDto {
  role: UserRole;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  async createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }

  @Patch(':id/reactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async reactivate(@Param('id') id: string) {
    return this.usersService.reactivateUser(id);
  }

  @Patch(':id/role')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.usersService.updateRole(id, dto.role);
  }

  @Post(':id/setup-token')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async regenerateSetupToken(@Param('id') id: string) {
    return this.usersService.regenerateSetupToken(id);
  }
}
