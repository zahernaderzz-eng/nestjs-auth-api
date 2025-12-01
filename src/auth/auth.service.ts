import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SignupDto } from './dtos/signup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';

import { nanoid } from 'nanoid';
import { ResetToken } from './entities/reset-token-entity';
import { MailService } from '../mail/mail.service';
import { OTPService } from '../otp/otp.service';
import { OTPType } from '../otp/type/OTPType';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './types/jwt-payload.type';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(ResetToken) private resetToken: Repository<ResetToken>,
    @InjectQueue('email') private readonly emailQueue: Queue,

    private jwtService: JwtService,
    private mailService: MailService,
    private otpService: OTPService,
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  // ───────────────────────────────────────────────
  async signup(signupData: SignupDto) {
    const { email, password, name } = signupData;

    const emailInUse = await this.userService.findOneBy({ email });
    if (emailInUse) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userService.create({
      name,
      email,
      password: hashedPassword,
    });

    await this.userService.save(user);

    const otp = await this.otpService.generateOTP(user, OTPType.OTP);

    await this.emailQueue.add('send-otp', {
      to: email,
      otp,
    });
  }

  // ───────────────────────────────────────────────
  async login(credentials: LoginDto) {
    const { email, password, otp } = credentials;

    const user = await this.userService.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'name', 'accountStatus'], // IMPORTANT
    });

    if (!user) {
      throw new UnauthorizedException('Wrong credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }

    // Handle OTP verification
    if (user.accountStatus === 'unverified') {
      if (!otp) {
        return {
          message: 'Your account is not verified. Please provide your OTP.',
          status: 'UNVERIFIED',
        };
      }

      const verified = await this.verifyToken(user.id, otp);
      if (!verified) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      user.accountStatus = 'verified';
      await this.userService.save(user);
    }

    const tokens = await this.generateUserTokens(user.id);

    return {
      message: 'Login successful',
      status: 'VERIFIED',
      data: {
        user: { id: user.id },
        tokens: {
          access: tokens.accessToken,
          refresh: tokens.refreshToken,
        },
      },
    };
  }

  // ───────────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.userService.findOneBy({ email });

    if (user) {
      const resetToken = nanoid(64);
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      await this.resetToken.upsert(
        {
          token: resetToken,
          expiryDate,
          userId: user.id,
        },
        ['userId'],
      );

      await this.emailQueue.add('password-reset', {
        to: email,
        token: resetToken,
      });
    }

    return {
      message: 'If this user exists, they will receive an email',
    };
  }

  // ───────────────────────────────────────────────
  async resetPassword(newPassword: string, resetToken: string) {
    const token = await this.resetToken.findOne({
      where: {
        token: resetToken,
        expiryDate: MoreThanOrEqual(new Date()),
      },
    });

    if (!token) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    await this.resetToken.delete({ id: token.id });

    const user = await this.userService.findOne({
      where: { id: token.userId },
      //todo change
      select: ['id', 'email', 'password', 'name', 'accountStatus'], // IMPORTANT
    });

    if (!user) {
      throw new InternalServerErrorException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await this.userService.save(user);
  }

  // ───────────────────────────────────────────────
  async refreshToken(refreshToken: string) {
    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET')!;
      const decoded = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      return this.generateUserTokens(decoded.userId);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // ───────────────────────────────────────────────
  async generateUserTokens(userId: number) {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET')!;
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')!;
    const accessExp = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN')!;
    const refreshExp = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    )!;

    const payload: JwtPayload = { userId };

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExp as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExp as any,
    });

    return { accessToken, refreshToken, payload };
  }

  // ───────────────────────────────────────────────
  async verifyToken(userId: number, token: string) {
    const valid = await this.otpService.validateOTP(userId, token);

    if (!valid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.otpService.deleteOtp(userId);
    return true;
  }

  // ───────────────────────────────────────────────
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userService.findOne({
      where: { id: userId },
      select: ['id', 'email', 'password', 'name'], // IMPORTANT
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;

    await this.userService.save(user);

    const tokens = await this.generateUserTokens(userId);

    return {
      message: 'Password updated successfully',
      tokens,
    };
  }

  // ───────────────────────────────────────────────
  async resendOtp(email: string) {
    const user = await this.userService.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.accountStatus === 'verified') {
      throw new BadRequestException('Account already verified');
    }

    const otp = await this.otpService.generateOTP(user, OTPType.OTP);

    await this.emailQueue.add('send-otp', {
      to: email,
      otp,
    });

    return { message: 'A new OTP has been sent to your email.' };
  }
}
