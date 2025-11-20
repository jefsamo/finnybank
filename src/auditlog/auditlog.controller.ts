/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { AuditlogService } from './auditlog.service';
import { CreateAuditlogDto } from './dto/create-auditlog.dto';
import type { Request } from 'express';

@Controller('auditlog')
export class AuditlogController {
  constructor(private readonly auditlogService: AuditlogService) {}

  @Post()
  create(@Body() createAuditlogDto: CreateAuditlogDto, @Req() req: Request) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.toString().split(',')[0].trim() : req?.ip;
    return this.auditlogService.create(createAuditlogDto, ip);
  }

  @Get()
  findAll() {
    return this.auditlogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditlogService.findOne(+id);
  }
}
