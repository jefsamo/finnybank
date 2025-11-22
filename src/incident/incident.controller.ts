/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { IncidentService } from './incident.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('incident')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('csa')
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @Post()
  create(
    @Body() createIncidentDto: CreateIncidentDto,
    @CurrentUser() user: any,
  ) {
    return this.incidentService.create(createIncidentDto, user.userId);
  }
  @Get('incidents-summary')
  getIncidentsSummary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.incidentService.getIncidentsSummary(from, to);
  }

  @Get()
  findAll() {
    return this.incidentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIncidentDto: UpdateIncidentDto,
  ) {
    return this.incidentService.update(+id, updateIncidentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incidentService.remove(id);
  }
}
