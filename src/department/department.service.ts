import { Injectable } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { Department, DepartmentDocument } from './schemas/department.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
  ) {}
  create(createDepartmentDto: CreateDepartmentDto) {
    const dept = new this.departmentModel(createDepartmentDto);

    return dept.save();
  }

  async findAll() {
    return await this.departmentModel.find().exec();
  }

  async findOne(id: string) {
    const dept = await this.departmentModel.findById(id);
    return dept;
  }
}
