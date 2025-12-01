import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { ChangePasswordDto } from './dtos/change-passord.dto';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //TODO : Post Signup
  @Post('signup')
  async signUp(@Body() signupData: SignupDto) {
    await this.authService.signup(signupData);
    return {
      message: 'User created successfully and Otp sent to email',
    };
  }

  //TODO : Post login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() credentials: LoginDto) {
    return this.authService.login(credentials);
  }

  @Post('resend-otp')
  async resendOtp(@Body('email') email: string) {
    await this.authService.resendOtp(email);
    return {
      message: 'new Otp is sent please check your email',
    };
  }
  //TODO : Post refresh token
  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @UseGuards(AuthenticationGuard)
  @Put('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req,
  ) {
    console.log(req);
    return this.authService.changePassword(
      req.userId,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  //this shoul be patvch
  @Put('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.newPassword,
      resetPasswordDto.resetToken,
    );
  }
}
