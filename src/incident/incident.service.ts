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

  async getIncidentsSummary(from?: string, to?: string) {
    const match: any = {};

    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

    const [result] = await this.incidentModel.aggregate([
      { $match: match },

      // Join user (to get department) – adjust collection names if needed
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'departments',
          localField: 'user.departmentId',
          foreignField: '_id',
          as: 'department',
        },
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },

      {
        $addFields: {
          departmentName: {
            $ifNull: ['$department.name', 'Unassigned'],
          },
        },
      },

      {
        $facet: {
          bySeverity: [
            {
              $group: {
                _id: '$urgency',
                count: { $sum: 1 },
              },
            },
          ],
          byType: [
            {
              $group: {
                _id: '$caseType',
                count: { $sum: 1 },
              },
            },
          ],
          byDepartment: [
            {
              $group: {
                _id: '$departmentName',
                count: { $sum: 1 },
              },
            },
          ],
          slaCompliance: [
            {
              $group: {
                _id: {
                  $cond: [
                    { $eq: ['$slaBreached', true] },
                    'Breached',
                    'Compliant',
                  ],
                },
                count: { $sum: 1 },
              },
            },
          ],
          avgResolution: [
            {
              $match: {
                timeToResolve: { $ne: null },
              },
            },
            {
              $project: {
                diffHours: {
                  $divide: [
                    { $subtract: ['$timeToResolve', '$createdAt'] },
                    1000 * 60 * 60,
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                avgHours: { $avg: '$diffHours' },
              },
            },
          ],
        },
      },
    ]);

    const mapFacet = (facet: { _id: any; count: number }[] = []) =>
      facet
        .filter((x) => x._id !== null && x._id !== undefined)
        .map((x) => ({
          label: String(x._id),
          count: x.count,
        }));

    const avgResolutionHours = result?.avgResolution?.[0]?.avgHours ?? 0;

    return {
      from: from ?? null,
      to: to ?? null,
      bySeverity: mapFacet(result?.bySeverity),
      byType: mapFacet(result?.byType),
      byDepartment: mapFacet(result?.byDepartment),
      slaCompliance: mapFacet(result?.slaCompliance),
      avgResolutionHours,
    };
  }
}
