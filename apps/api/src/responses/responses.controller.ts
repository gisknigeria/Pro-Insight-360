import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ResponsesService,
  SubmitResponseDto,
  SaveDraftDto,
  SyncResponseDto,
} from './responses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('responses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResponsesController {
  constructor(private responsesService: ResponsesService) {}

  @Post('draft')
  @Roles(UserRole.HOD, UserRole.RESPONDENT, UserRole.CLIENT_ADMIN)
  @HttpCode(HttpStatus.OK)
  saveDraft(@Body() dto: SaveDraftDto, @CurrentUser() user: any) {
    return this.responsesService.saveDraft(dto, user.id);
  }

  @Get('draft/:formId')
  @Roles(UserRole.HOD, UserRole.RESPONDENT, UserRole.CLIENT_ADMIN)
  getDraft(@Param('formId') formId: string, @CurrentUser() user: any) {
    return this.responsesService.getDraft(formId, user.id);
  }

  @Get('assigned')
  @Roles(UserRole.HOD, UserRole.RESPONDENT, UserRole.CLIENT_ADMIN)
  getAssignedForms(@CurrentUser() user: any) {
    return this.responsesService.getMyAssignedForms(user.id);
  }

  @Post('submit')
  @Roles(UserRole.HOD, UserRole.RESPONDENT, UserRole.CLIENT_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  submit(@Body() dto: SubmitResponseDto, @CurrentUser() user: any) {
    return this.responsesService.submit(dto, user.id);
  }

  @Post('sync')
  @Roles(UserRole.HOD, UserRole.RESPONDENT, UserRole.CLIENT_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  sync(@Body() dto: SyncResponseDto, @CurrentUser() user: any) {
    return this.responsesService.syncOfflineResponse(dto, user.id);
  }

  @Get('form/:formId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONSULTANT, UserRole.CLIENT_ADMIN)
  getFormResponses(@Param('formId') formId: string) {
    return this.responsesService.getFormResponses(formId);
  }

  @Get('mine')
  @Roles(UserRole.HOD, UserRole.RESPONDENT, UserRole.CLIENT_ADMIN)
  getMyResponses(@CurrentUser() user: any) {
    return this.responsesService.getMyResponses(user.id);
  }
}
