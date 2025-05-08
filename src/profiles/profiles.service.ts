import { Injectable } from '@nestjs/common';

export interface Profile {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
}

@Injectable()
export class ProfilesService {
  profiles: Profile[] = [];

  create(profile: Omit<Profile, 'id'>): void {
    this.profiles.push({
      ...profile,
      id: this.generateId(),
    });
  }

  getAll(): Profile[] {
    return structuredClone(this.profiles);
  }

  getOne(id: number): Profile | null {
    const profile = this.profiles.find((profile) => profile.id === id);
    return profile ? structuredClone(profile) : null;
  }

  update(id: number, profile: Omit<Profile, 'id'>): void {
    const index = this.profiles.findIndex((profile) => profile.id === id);
    this.profiles[index] = {
      ...profile,
      id,
    };
  }

  delete(id: number): void {
    this.profiles = this.profiles.filter((profile) => profile.id !== id);
  }

  private generateId(): number {
    return Math.floor(Math.random() * 1_000_000_000);
  }
}
