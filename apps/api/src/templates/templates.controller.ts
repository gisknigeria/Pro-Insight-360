import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  TemplatesService,
  CreateTemplateDto,
  UpdateTemplateDto,
} from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

class InstantiateTemplateDto {
  evaluationId: string;
  title: string;
}

@Controller('templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateTemplateDto, @CurrentUser() user: any) {
    return this.templatesService.create(dto, user.id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  findAll(
    @Query('sector') sector?: string,
    @Query('evaluationType') evaluationType?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.templatesService.findAll({ sector, evaluationType, keyword });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() user: any,
  ) {
    return this.templatesService.update(id, dto, user.id);
  }

  @Patch(':id/publish')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  publish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.templatesService.publish(id, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.templatesService.delete(id, user.id);
  }

  @Post(':id/instantiate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  instantiate(
    @Param('id') id: string,
    @Body() dto: InstantiateTemplateDto,
    @CurrentUser() user: any,
  ) {
    return this.templatesService.instantiateAsForm(
      id,
      dto.evaluationId,
      dto.title,
      user.id,
    );
  }

  @Get(':id/versions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  getVersionHistory(@Param('id') id: string) {
    return this.templatesService.getVersionHistory(id);
  }
}
