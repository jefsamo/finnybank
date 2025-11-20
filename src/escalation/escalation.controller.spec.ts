import { Test, TestingModule } from '@nestjs/testing';
import { EscalationController } from './escalation.controller';
import { EscalationService } from './escalation.service';

describe('EscalationController', () => {
  let controller: EscalationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EscalationController],
      providers: [EscalationService],
    }).compile();

    controller = module.get<EscalationController>(EscalationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
