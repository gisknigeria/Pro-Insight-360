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
  Query,
} from '@nestjs/common';
import { FormsService, CreateFormDto, UpdateFormDto } from './forms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

class AssignRespondentsDto {
  respondentIds: string[];
}

class ReopenFormDto {
  deadline: string;
}

@Controller('forms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FormsController {
  constructor(private formsService: FormsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  create(@Body() dto: CreateFormDto, @CurrentUser() user: any) {
    return this.formsService.create(dto, user.id);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT, UserRole.CLIENT_ADMIN)
  findOne(@Param('id') id: string) {
    return this.formsService.findOne(id);
  }

  @Get(':id/definition')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT, UserRole.HOD, UserRole.RESPONDENT)
  getDefinition(@Param('id') id: string) {
    return this.formsService.getDefinition(id);
  }

  @Get(':id/pretty')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  getPrettyJson(@Param('id') id: string) {
    return this.formsService.getPrettyJson(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFormDto,
    @CurrentUser() user: any,
  ) {
    return this.formsService.update(id, dto, user.id);
  }

  @Patch(':id/publish')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  @HttpCode(HttpStatus.OK)
  publish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.formsService.publish(id, user.id);
  }

  @Patch(':id/close')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  @HttpCode(HttpStatus.OK)
  close(@Param('id') id: string, @CurrentUser() user: any) {
    return this.formsService.close(id, user.id);
  }

  @Patch(':id/reopen')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  @HttpCode(HttpStatus.OK)
  reopen(
    @Param('id') id: string,
    @Body() dto: ReopenFormDto,
    @CurrentUser() user: any,
  ) {
    return this.formsService.reopen(id, dto.deadline, user.id);
  }

  @Post(':id/respondents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT, UserRole.CLIENT_ADMIN)
  @HttpCode(HttpStatus.OK)
  assignRespondents(
    @Param('id') id: string,
    @Body() dto: AssignRespondentsDto,
    @CurrentUser() user: any,
  ) {
    return this.formsService.assignRespondents(id, dto.respondentIds, user.id);
  }

  @Get(':id/completion')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT, UserRole.CLIENT_ADMIN)
  getCompletionStatus(@Param('id') id: string) {
    return this.formsService.getCompletionStatus(id);
  }

  @Get(':id/check-deletion/:questionId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT)
  checkQuestionDeletion(
    @Param('id') formId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.formsService.checkQuestionDeletion(formId, questionId);
  }
}
