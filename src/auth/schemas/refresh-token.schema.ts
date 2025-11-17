/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/auth/schemas/refresh-token.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId: string;

  @Prop()
  tokenHash: string;

  @Prop()
  userAgent?: string;

  @Prop()
  ip?: string;

  @Prop()
  expiresAt: Date;

  @Prop({ default: false })
  revoked: boolean;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
