/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateIncidentDto {
  @IsString()
  @IsOptional()
  userId: string;

  @IsString()
  customerName: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  productService: string;

  @IsString()
  caseType: string;
  @IsString()
  status: string;

  @IsString()
  @IsIn(['low', 'medium', 'high'])
  urgency: string;

  @IsString()
  source: string;

  @IsNumber()
  firstFourCardDigits?: number;
  @IsNumber()
  lastFourCardDigits?: number;

  @IsNumber()
  @IsOptional()
  referenceId?: number;

  @IsString()
  assignedTo: string;

  @IsString()
  @IsOptional()
  comment?: string;
  @IsString()
  @IsOptional()
  attachment?: string;
}
