/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/users/dto/create-user.dto.ts
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  departmentId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles: string[];

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}
