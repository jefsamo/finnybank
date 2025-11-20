import { Injectable } from '@nestjs/common';
import { CreateAuditlogDto } from './dto/create-auditlog.dto';
import { InjectModel } from '@nestjs/mongoose';
import { AuditLog, AuditLogDocument } from './schemas/auditlog.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuditlogService {
  constructor(
    @InjectModel(AuditLog.name)
    private auditModel: Model<AuditLogDocument>,
  ) {}
  async create(createAuditlogDto: CreateAuditlogDto, ip: string | undefined) {
    return await this.auditModel.create({ ...createAuditlogDto, ip });
  }

  async findAll() {
    return await this.auditModel.find().exec();
  }

  findOne(id: number) {
    return `This action returns a #${id} auditlog`;
  }
}
