/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
import {
  Department,
  DepartmentDocument,
} from '../department/schemas/department.schema';

@Injectable()
export class IncidentService {
  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
  ) {}
  async create(createIncidentDto: CreateIncidentDto, userId: string) {
    let departmentId = createIncidentDto.departmentId;

    if (!departmentId) {
      const department = await this.departmentModel.findOne({
        name: new RegExp(`^${createIncidentDto.productService}$`, 'i'),
      });

      if (!department) {
        throw new BadRequestException(
          `No department found for product: ${createIncidentDto.productService}`,
        );
      }

      departmentId = `${department._id}`;
    }

    const incident = new this.incidentModel({
      ...createIncidentDto,
      departmentId,
    });

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

      // 💡 FIX: Convert departmentId string to ObjectId for correct lookup.
      // This is necessary if departmentId in 'incidents' is a string
      // but _id in 'departments' is an ObjectId.
      {
        $addFields: {
          departmentObjectId: {
            $cond: [
              // Only attempt conversion if departmentId is not null
              { $ne: ['$departmentId', null] },
              { $toObjectId: '$departmentId' },
              null,
            ],
          },
        },
      },

      // 🔹 Join department using the converted ObjectId field
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentObjectId', // <-- Using the converted field
          foreignField: '_id',
          as: 'department',
        },
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },

      {
        $addFields: {
          // Use the department name, or 'Unassigned' as a fallback label
          departmentName: {
            $ifNull: ['$department.name', 'Unassigned'],
          },
        },
      },

      // 🔍 Generate all summary facets in one go
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

          // New Facet: Group incidents by department and collect the full documents
          incidentsByDepartment: [
            {
              $group: {
                _id: '$departmentName',
                incidents: { $push: '$$ROOT' },
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
              // Only consider incidents with a resolved time
              $match: {
                timeToResolve: { $ne: null },
              },
            },
            {
              $project: {
                // Calculate difference in hours
                diffHours: {
                  $divide: [
                    { $subtract: ['$timeToResolve', '$createdAt'] },
                    1000 * 60 * 60, // milliseconds in an hour
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

    // --- Helper Functions for Mapping Results ---
    const mapFacet = (facet: { _id: any; count: number }[] = []) =>
      facet
        .filter((x) => x._id !== null && x._id !== undefined)
        .map((x) => ({
          label: String(x._id),
          count: x.count,
        }));

    const mapIncidentsByDepartment = (
      facet: { _id: string; incidents: any[] }[] = [],
    ) =>
      facet
        .filter((x) => x._id !== null && x._id !== undefined)
        .map((x) => ({
          departmentName: x._id,
          incidents: x.incidents,
        }));

    const avgResolutionHours = result?.avgResolution?.[0]?.avgHours ?? 0;

    // --- Return final summary object ---
    return {
      from: from ?? null,
      to: to ?? null,
      bySeverity: mapFacet(result?.bySeverity),
      byType: mapFacet(result?.byType),
      byDepartment: mapFacet(result?.byDepartment),
      incidentsByDepartment: mapIncidentsByDepartment(
        result?.incidentsByDepartment,
      ),
      slaCompliance: mapFacet(result?.slaCompliance),
      avgResolutionHours,
    };
  }
}
