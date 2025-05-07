import { Module } from '@nestjs/common';
import { ProfilesModule } from './profiles/profiles.module';

@Module({
  imports: [ProfilesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
