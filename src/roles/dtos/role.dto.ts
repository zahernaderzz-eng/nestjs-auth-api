import { Type } from 'class-transformer';
import {
  IsString,
  ValidateNested,
  IsEnum,
  ArrayUnique,
  IsNotEmpty,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Resource } from '../enums/resource.enum';
import { Action } from '../enums/action.enum';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Permission)
  permissions: Permission[];
}

export class Permission {
  @IsEnum(Resource)
  resource: Resource;

  @IsArray()
  @IsEnum(Action, { each: true })
  @ArrayUnique()
  actions: Action[];
}
