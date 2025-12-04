import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './role.dto';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
