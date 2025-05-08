import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { Profile, ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() profile: Omit<Profile, 'id'>) {
    this.profilesService.create(profile);
  }

  @Get()
  getAll() {
    return this.profilesService.getAll();
  }

  @Get('/:id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.profilesService.getOne(id);
  }

  @Put('/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() profile: Omit<Profile, 'id'>,
  ) {
    this.profilesService.update(id, profile);
  }

  @Delete('/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    this.profilesService.delete(id);
  }
}
