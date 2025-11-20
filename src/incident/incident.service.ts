/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Incident, IncidentDocument } from './schemas/incident.schema';
import { Model } from 'mongoose';

@Injectable()
export class IncidentService {
  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
  ) {}
  create(createIncidentDto: CreateIncidentDto, userId: string) {
    const incident = new this.incidentModel(createIncidentDto);
    incident.referenceId = Number(this.generateTenDigitNumber());
    incident.userId = userId;
    return incident.save();
  }

  async findAll() {
    return await this.incidentModel.find().exec();
  }

  async findOne(id: string) {
    const incident = await this.incidentModel.findById(id).exec();
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return incident;
  }

  async update(id: number, updateIncidentDto: UpdateIncidentDto) {
    const incident = await this.incidentModel.findByIdAndUpdate(
      id,
      updateIncidentDto,
      {
        new: true,
      },
    );

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return incident;
  }

  async remove(id: string) {
    const incident = await this.incidentModel.findById(id);
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    await this.incidentModel.findByIdAndDelete(id);

    return 'Incident deleted successfully';
  }

  private generateTenDigitNumber(): string {
    // First digit: 1–9
    let result = (Math.floor(Math.random() * 9) + 1).toString();

    // Remaining 9 digits: 0–9
    for (let i = 0; i < 9; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }
}
