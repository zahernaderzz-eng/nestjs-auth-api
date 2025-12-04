import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dtos/role.dto';
import { UpdateRoleDto } from './dtos/update.role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async getAllRoles() {
    return this.roleRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getRoleById(roleId: string) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    return role;
  }

  async createRole(createRoleDto: CreateRoleDto) {
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException(
        `Role with name ${createRoleDto.name} already exists`,
      );
    }

    const roleEntity = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(roleEntity);
  }

  async updateRole(roleId: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.getRoleById(roleId);

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name },
      });

      if (existingRole) {
        throw new ConflictException(
          `Role with name ${updateRoleDto.name} already exists`,
        );
      }
    }

    Object.assign(role, updateRoleDto);
    return this.roleRepository.save(role);
  }

  async deleteRole(roleId: string) {
    const role = await this.getRoleById(roleId);

    if (role.name === 'super_admin') {
      throw new ConflictException('forbiden there is no role with this id');
    }

    await this.roleRepository.remove(role);
    return { message: 'Role deleted successfully' };
  }
}
