/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/incidents/incidents-escalation.job.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument } from './schemas/incident.schema';
import { EscalationService } from 'src/escalation/escalation.service';

@Injectable()
export class IncidentsEscalationJob {
  private readonly logger = new Logger(IncidentsEscalationJob.name);

  constructor(
    @InjectModel(Incident.name)
    private incidentModel: Model<IncidentDocument>,
    private escalationsService: EscalationService,
  ) {}

  // runs every 5 minutes; tweak as you like
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkOverdueIncidents() {
    const now = new Date();

    // Only incidents that:
    // - are not resolved
    // - have passed their timeToResolve
    // - have NOT been escalated before (hasEscalation != true)
    const overdueIncidents = await this.incidentModel
      .find({
        status: { $ne: 'resolved' },
        timeToResolve: { $lt: now },
        $or: [{ hasEscalation: { $exists: false } }, { hasEscalation: false }],
      })
      .exec();

    if (!overdueIncidents.length) return;

    this.logger.log(
      `Found ${overdueIncidents.length} overdue incidents to evaluate for escalation`,
    );

    for (const incident of overdueIncidents) {
      try {
        // extra safety: if you still want to avoid duplicates per incident
        const existing = await this.escalationsService.findOpenByIncident(
          incident._id.toString(),
        );
        if (existing) {
          // mark hasEscalation, just in case it was false before
          if (!incident.hasEscalation) {
            incident.hasEscalation = true;
            await incident.save();
          }
          continue;
        }

        await this.escalationsService.createForIncident(incident);

        // mark on the incident so we never pick it again
        incident.hasEscalation = true;
        incident.status = 'escalated';
        incident.slaBreached = true; // optional but usually true here
        await incident.save();

        this.logger.log(
          `Created escalation for incident ${incident._id.toString()}`,
        );
      } catch (err) {
        this.logger.error(
          `Error creating escalation for incident ${incident._id.toString()}: ${err?.message}`,
        );
      }
    }
  }
}
