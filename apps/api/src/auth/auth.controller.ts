import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { IsString, IsNotEmpty } from 'class-validator';

class LoginDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

class SetupAccountDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

class MfaVerifyDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

class CreateSetupTokenDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  secret: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: any) {
    const ipAddress =
      req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    return this.authService.login(req.user, ipAddress);
  }

  @Post('setup')
  @HttpCode(HttpStatus.OK)
  async setupAccount(@Body() dto: SetupAccountDto) {
    return this.authService.setupAccount(dto.token, dto.password);
  }

  @Post('dev/create-setup-token')
  @HttpCode(HttpStatus.OK)
  async createSetupToken(@Body() dto: CreateSetupTokenDto) {
    const secret = process.env.SETUP_TOKEN_SECRET;
    if (!secret || secret !== dto.secret) {
      throw new ForbiddenException('Forbidden');
    }
    return this.authService.createSetupToken(dto.email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/enable')
  async enableMfa(@CurrentUser() user: any) {
    return this.authService.enableMfa(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMfa(@CurrentUser() user: any, @Body() dto: MfaVerifyDto) {
    const valid = await this.authService.verifyMfa(user.id, dto.code);
    if (!valid) {
      return { verified: false, message: 'Invalid verification code.' };
    }
    return { verified: true, message: 'MFA verified successfully.' };
  }
}
