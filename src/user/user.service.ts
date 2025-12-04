import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  //
  async findOneBy(filter: Partial<User>) {
    return this.userRepo.findOneBy(filter);
  }

  async findOne(filter: any) {
    return this.userRepo.findOne(filter);
  }

  async create(data: Partial<User>) {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async save(user: User) {
    return this.userRepo.save(user);
  }

  async delete(id: string | number) {
    return this.userRepo.delete(id);
  }

  async findAll() {
    return this.userRepo.find();
  }

  async getUserPermissions(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.role) {
      throw new NotFoundException('Role not assigned to user');
    }

    return user.role.permissions;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}
