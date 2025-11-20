// src/escalations/schemas/escalation.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument, Types } from 'mongoose';

export type EscalationDocument = Escalation & MongooseDocument;

@Schema({ timestamps: true })
export class Escalation {
  @Prop({ type: Types.ObjectId, ref: 'Incident', required: true, index: true })
  incidentId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  createdBy?: string; // system user or null if system-generated

  @Prop({ default: 'open' })
  status: 'open' | 'in-progress' | 'closed';

  @Prop({ default: 1 })
  level: number; // if you want multi-level escalation later

  @Prop()
  reason?: string;

  @Prop()
  notes?: string;

  @Prop()
  resolvedAt?: Date;
}

export const EscalationSchema = SchemaFactory.createForClass(Escalation);
