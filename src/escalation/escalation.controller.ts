import { Controller } from '@nestjs/common';
import { EscalationService } from './escalation.service';

@Controller('escalation')
export class EscalationController {
  constructor(private readonly escalationService: EscalationService) {}
}
