import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'admin@system.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol)',
    example: 'SuperAdmin123!',
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'User otp ',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  otp?: string;
}
