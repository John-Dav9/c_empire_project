import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/auth/entities/user.entity';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { UpdateUserDto } from 'src/dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.repo.create({
      ...dto,
      password: hashedPassword,
    });
    return this.repo.save(user);
  }

  findAll() {
    return this.repo.find({ relations: ['profile'] });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id }, relations: ['profile'] });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      return null;
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = this.repo.merge(user, dto);
    return this.repo.save(updated);
  }

  async remove(id: string) {
    return this.repo.delete(id);
  }
}
