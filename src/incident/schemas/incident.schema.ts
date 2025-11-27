/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/auth/schemas/refresh-token.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IncidentDocument = Incident & Document;

@Schema({ timestamps: true })
export class Incident {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: string;
  @Prop({ type: Types.ObjectId, ref: 'Department', index: true })
  departmentId?: string;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  productService: string;

  @Prop({ required: true })
  caseType: string;

  // urgency/severity
  @Prop({ required: true })
  urgency: string;
  @Prop()
  status: string;

  // calculated from the severity chosen
  // if low - add 72hours to the current time
  // if medium - add 48hours to the current time
  // if high - add 24hours to the current time
  @Prop()
  timeToResolve: Date;

  // Calculated in seconds - subtract the dateCreated minus the date it was actually resolved
  @Prop()
  timeTakenToResolve: number;

  @Prop({ required: true })
  source: string;

  @Prop()
  firstFourCardDigits?: number;
  @Prop()
  lastFourCardDigits?: number;

  @Prop()
  referenceId: number;

  @Prop()
  assignedTo: string;

  @Prop()
  comment?: string;
  @Prop()
  attachment?: string;

  // extra tracking fields (not required, but useful)
  @Prop()
  resolvedAt?: Date;

  @Prop({ default: false })
  slaBreached?: boolean;

  // timestamps from @Schema({ timestamps: true })
  createdAt?: Date;
  updatedAt?: Date;

  _id: any;
  @Prop({ default: false })
  hasEscalation?: boolean;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);

/**
 * Pre-save hook:
 * - Calculate timeToResolve based on urgency when creating
 * - When status becomes 'resolved', set resolvedAt + timeTakenToResolve
 * - Update slaBreached based on timeToResolve
 */
IncidentSchema.pre<IncidentDocument>('save', function (next) {
  const now = new Date();

  // 1) timeToResolve on creation (or if not set)
  if (!this.timeToResolve && this.urgency) {
    const urgencyToHours: Record<string, number> = {
      low: 0.17,
      medium: 0.1,
      high: 0.05,
    };

    const hoursToAdd = urgencyToHours[this.urgency.toLowerCase()] ?? 48; // default 48h

    this.timeToResolve = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  }

  // 2) If status just became 'resolved', set resolvedAt + timeTakenToResolve
  if (this.isModified('status') && this.status.toLowerCase() === 'resolved') {
    if (!this.resolvedAt) {
      this.resolvedAt = now;
    }
    if (!this.timeTakenToResolve && this.createdAt && this.resolvedAt) {
      const diffMs = this.resolvedAt.getTime() - this.createdAt.getTime();
      this.timeTakenToResolve = Math.floor(diffMs / 1000); // seconds
    }
  }

  // 3) SLA breach flag (for any save)
  if (this.timeToResolve && this.status.toLowerCase() !== 'resolved') {
    this.slaBreached = now > this.timeToResolve;
  }

  next();
});
