import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from 'src/auth/entities/profile.entity';
import { UpdateProfileDto } from 'src/dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private repo: Repository<Profile>,
  ) {}

  findByUser(userId: string) {
    return this.repo.findOne({ where: { user: { id: userId } } });
  }

  async update(id: string, dto: UpdateProfileDto) {
    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }
}
