import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { SignupDto } from './dtos/signup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThanOrEqual, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { nanoid } from 'nanoid';
import { ResetToken } from './entities/reset-token-entity';
import { OTPService } from '../otp/otp.service';
import { OTPType } from '../otp/type/OTPType';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './types/jwt-payload.type';

import { User } from '../user/entities/user.entity';
import { AccountStatus } from '../user/enums/account.status.enum';
import { Role } from '../roles/entities/role.entity';
import { EmailQueueService } from '../mail/email-queue.service';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(ResetToken) private resetToken: Repository<ResetToken>,

    private readonly dataSource: DataSource,
    private jwtService: JwtService,
    private otpService: OTPService,
    private userService: UserService,
    private configService: ConfigService,
    private readonly emailQueue: EmailQueueService,
  ) {}

  // ───────────────────────────────────────────────

  async signup(signupData: SignupDto): Promise<void> {
    const { email, password, name, address, phone } = signupData;

    const existingUser = await this.userService.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const defaultRole = await queryRunner.manager.findOne(Role, {
        where: { name: 'customer' },
      });

      if (!defaultRole) {
        throw new Error('Default role not found. Make sure roles are seeded.');
      }

      const user = queryRunner.manager.create(User, {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        roleId: defaultRole.id,
      });
      await queryRunner.manager.save(User, user);

      const otp = await this.otpService.generateOTPWithManager(
        queryRunner.manager,
        user,
        OTPType.OTP,
      );

      await this.emailQueue.sendOtp({
        to: email,
        otp,
      });

      await queryRunner.commitTransaction();
      this.logger.log(`User signed up successfully: ${email}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Signup failed for ${email}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ───────────────────────────────────────────────

  async login(credentials: LoginDto) {
    const { email, password, otp } = credentials;

    const user = await this.userService.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials ');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.accountStatus === AccountStatus.UNVERIFIED) {
      if (!otp) {
        return {
          message: 'Account verification required',
          status: 'UNVERIFIED',
        };
      }

      const verified = await this.verifyToken(user.id, otp);
      if (!verified) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      user.accountStatus = AccountStatus.VERIFIED;
      await this.userService.save(user);
    }

    const tokens = await this.generateUserTokens(user.id);

    return {
      message: 'Login successful',
      status: 'VERIFIED',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    };
  }

  // ───────────────────────────────────────────────

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userService.findOneBy({ email });

    if (user) {
      const recentToken = await this.resetToken.findOne({
        where: {
          userId: user.id,
          expiryDate: MoreThanOrEqual(new Date()),
        },
        order: { id: 'DESC' },
      });

      if (recentToken) {
        const ONE_HOUR = 3600000;
        const FIVE_MINUTES = 300000;

        const createdAt = recentToken.expiryDate.getTime() - ONE_HOUR;

        const diff = Date.now() - createdAt;

        if (diff < FIVE_MINUTES) {
          this.logger.warn(`Rate limit hit for forgot password: ${email}`);
          return {
            message: 'If this user exists, they will receive an email',
          };
        }
      }

      const resetToken = nanoid(64);
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      await this.resetToken.delete({ userId: user.id });

      await this.resetToken.save({
        token: resetToken,
        expiryDate,
        userId: user.id,
      });
      try {
        await this.emailQueue.sendPasswordReset({
          to: email,
          token: resetToken,
        });
      } catch (error) {
        this.logger.error(
          `Failed to queue password reset email: ${email}`,
          error.stack,
        );
      }
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
      relations: ['user'],
    });

    if (!token) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        'user',
        { id: token.userId },
        { password: hashedPassword },
      );
      await manager.delete(ResetToken, { userId: token.userId });
    });

    this.logger.log(`Password reset successful for user ID: ${token.userId}`);
  }

  // ───────────────────────────────────────────────

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userService.findOne({
      where: { id: userId },
      select: ['id', 'email', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }
    const samePassword = await bcrypt.compare(newPassword, user.password);

    if (samePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
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
      return { message: 'If your account exists, a new OTP has been sent' };
    }

    if (user.accountStatus === 'verified') {
      throw new BadRequestException('Account already verified');
    }

    const otp = await this.otpService.generateOTP(user, OTPType.OTP);

    await this.emailQueue.sendOtp({
      to: email,
      otp,
    });

    return { message: 'A new OTP has been sent to your email.' };
  }

  // ───────────────────────────────────────────────

  async refreshToken(refreshToken: string) {
    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET')!;
      const decoded = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
      const user = await this.userService.findOneBy({ id: decoded.userId });
      if (!user || user.accountStatus === 'unverified') {
        throw new UnauthorizedException('User not found or unverified');
      }

      return this.generateUserTokens(decoded.userId);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      throw new UnauthorizedException('Token verification failed');
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

    return { accessToken, refreshToken, expiresIn: accessExp };
  }

  // ───────────────────────────────────────────────

  async verifyToken(userId: number, token: string) {
    const valid = await this.otpService.validateOTP(userId, token);

    if (!valid) {
      return false;
    }

    await this.otpService.deleteOtp(userId);
    return true;
  }
}
