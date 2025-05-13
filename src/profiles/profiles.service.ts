import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from './profile.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
  ) {}

  async create(profile: Omit<Profile, 'id'>): Promise<void> {
    delete profile['id'];
    await this.profilesRepository.save(profile);
  }

  getAll(): Promise<Profile[]> {
    return this.profilesRepository.find();
  }

  getOne(id: number): Promise<Profile | null> {
    return this.profilesRepository.findOne({
      where: {
        id,
      },
    });
  }

  async update(id: number, profile: Omit<Profile, 'id'>): Promise<void> {
    await this.profilesRepository.save({ ...profile, id });
  }

  async delete(id: number): Promise<void> {
    await this.profilesRepository.delete(id);
  }
}
