import { PartialType } from '@nestjs/mapped-types';
import { CreateEscalationDto } from './create-escalation.dto';

export class UpdateEscalationDto extends PartialType(CreateEscalationDto) {}
