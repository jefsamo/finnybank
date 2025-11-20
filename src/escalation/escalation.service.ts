/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/escalations/escalations.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Escalation, EscalationDocument } from './schemas/escalation.schema';
import { IncidentDocument } from 'src/incident/schemas/incident.schema';
// import { IncidentDocument } from '../incidents/schemas/incident.schema';

@Injectable()
export class EscalationService {
  constructor(
    @InjectModel(Escalation.name)
    private escalationModel: Model<EscalationDocument>,
  ) {}

  async findOpenByIncident(
    incidentId: string,
  ): Promise<EscalationDocument | null> {
    return this.escalationModel.findOne({ incidentId, status: 'open' }).exec();
  }

  async createForIncident(
    incident: IncidentDocument,
  ): Promise<EscalationDocument> {
    const escalation = new this.escalationModel({
      incidentId: incident._id,
      status: 'open',
      level: 1,
      reason: 'SLA breached: incident not resolved before timeToResolve',
      notes: `Incident ${incident._id} overdue; urgency=${incident.urgency}, timeToResolve=${incident.timeToResolve?.toISOString()}`,
    });

    return escalation.save();
  }
}
