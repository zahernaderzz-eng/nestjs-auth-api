import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dtos/role.dto';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { Resource } from '../roles/enums/resource.enum';
import { Action } from '../roles/enums/action.enum';
import { UpdateRoleDto } from './dtos/update.role.dto';

@UseGuards(AuthenticationGuard, AuthorizationGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions([
    {
      resource: Resource.users,
      actions: [Action.read],
    },
  ])
  async getAllRoles() {
    return this.rolesService.getAllRoles();
  }

  @Get(':id')
  @Permissions([
    {
      resource: Resource.users,
      actions: [Action.read],
    },
  ])
  async getRoleById(@Param('id') id: string) {
    return this.rolesService.getRoleById(id);
  }

  @Post()
  @Permissions([
    {
      resource: Resource.users,
      actions: [Action.create],
    },
  ])
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @Patch(':id')
  @Permissions([
    {
      resource: Resource.users,
      actions: [Action.update],
    },
  ])
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  @Permissions([
    {
      resource: Resource.users,
      actions: [Action.delete],
    },
  ])
  async deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }
}
