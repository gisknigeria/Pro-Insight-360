import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

class CreateOrgDto {
  name: string;
  sector?: string;
}

class UpdateOrgDto {
  name?: string;
  sector?: string;
}

@Controller('organisations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganisationsController {
  constructor(private orgsService: OrganisationsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  create(@Body() dto: CreateOrgDto) {
    return this.orgsService.create(dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  findAll() {
    return this.orgsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT, UserRole.CLIENT_ADMIN)
  findOne(@Param('id') id: string) {
    return this.orgsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  update(@Param('id') id: string, @Body() dto: UpdateOrgDto) {
    return this.orgsService.update(id, dto);
  }

  @Patch(':id/archive')
  @Roles(UserRole.SUPER_ADMIN)
  archive(@Param('id') id: string) {
    return this.orgsService.archive(id);
  }
}
