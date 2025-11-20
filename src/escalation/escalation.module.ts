// src/escalations/escalations.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Escalation, EscalationSchema } from './schemas/escalation.schema';
import { EscalationService } from './escalation.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Escalation.name, schema: EscalationSchema },
    ]),
  ],
  providers: [EscalationService],
  exports: [EscalationService],
})
export class EscalationModule {}
