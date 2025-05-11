import { Module } from '@nestjs/common';
import { ProfilesModule } from './profiles/profiles.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [ProfilesModule, HealthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
