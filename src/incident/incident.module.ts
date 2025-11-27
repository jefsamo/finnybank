/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { IncidentService } from './incident.service';
import { IncidentController } from './incident.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Incident, IncidentSchema } from './schemas/incident.schema';
import { EscalationModule } from 'src/escalation/escalation.module';
import { IncidentsEscalationJob } from './incident-escalation.job';
import {
  Department,
  DepartmentSchema,
} from '../department/schemas/department.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Incident.name, schema: IncidentSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
    EscalationModule,
  ],
  controllers: [IncidentController],
  providers: [IncidentService, IncidentsEscalationJob],
})
export class IncidentModule {}
