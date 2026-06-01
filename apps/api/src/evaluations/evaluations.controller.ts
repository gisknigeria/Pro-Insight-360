import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  EvaluationsService,
  CreateEvaluationDto,
  UpdateEvaluationDto,
} from './evaluations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

class AssignConsultantsDto {
  consultantIds: string[];
}

@Controller('evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationsController {
  constructor(private evaluationsService: EvaluationsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  create(@Body() dto: CreateEvaluationDto, @CurrentUser() user: any) {
    return this.evaluationsService.create(dto, user.id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT, UserRole.CLIENT_ADMIN)
  findAll(@CurrentUser() user: any) {
    return this.evaluationsService.findAll(user.id, user.role);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT, UserRole.CLIENT_ADMIN)
  findOne(@Param('id') id: string) {
    return this.evaluationsService.findOne(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  @HttpCode(HttpStatus.OK)
  activate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.evaluationsService.activate(id, user.id);
  }

  @Patch(':id/archive')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  archive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.evaluationsService.archive(id, user.id);
  }

  @Post(':id/consultants')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  @HttpCode(HttpStatus.OK)
  assignConsultants(
    @Param('id') id: string,
    @Body() dto: AssignConsultantsDto,
    @CurrentUser() user: any,
  ) {
    return this.evaluationsService.assignConsultants(
      id,
      dto.consultantIds,
      user.id,
    );
  }
}
