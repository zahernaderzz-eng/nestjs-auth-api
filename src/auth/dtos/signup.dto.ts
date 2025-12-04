import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class SignupDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
  @ApiProperty({
    description: 'User name',
    example: 'omarHashy',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description:
      'New password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol)',
    example: 'NewSecurePass123!',
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  roleId?: string;
}
