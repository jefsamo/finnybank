/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// src/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditlogService } from 'src/auditlog/auditlog.service';
import {
  AuditLog,
  AuditLogDocument,
} from 'src/auditlog/schemas/auditlog.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private auditlogService: AuditlogService,
    private jwt: JwtService,
    private config: ConfigService,
    @InjectModel(AuditLog.name)
    private auditModel: Model<AuditLogDocument>,
  ) {}

  private hashPassword(password: string): string {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private getAccessToken(payload: any): string {
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn:
        this.config.get<JwtSignOptions['expiresIn']>('JWT_ACCESS_EXPIRES_IN') ??
        '15m',
    });
  }

  private getRefreshToken(payload: any): string {
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn:
        this.config.get<JwtSignOptions['expiresIn']>(
          'JWT_REFRESH_EXPIRES_IN',
        ) ?? '7d',
    });
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findUserByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already in use');

    const passwordHash = await this.hashPassword(dto.password);
    const user = await this.usersService.createUser({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    await this.usersService.setPassword(user._id.toString(), passwordHash);

    // await this.auditlogService.create(
    //   {
    //     action: 'New user registered in',
    //   },
    //   'sjc',
    // );

    const tokens = this.issueTokens(user);

    return {
      user,
      ...tokens,
    };
  }

  async createUser(dto: RegisterDto) {
    const existing = await this.usersService.findUserByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already in use');

    const passwordHash = await this.hashPassword(dto.password);
    const user = await this.usersService.createUser({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    await this.usersService.setPassword(user._id.toString(), passwordHash);

    await this.auditModel.create({
      name: `${user.firstName} ${user.lastName}`,
      action: 'New user registered',
    });

    const tokens = this.issueTokens(user);

    return {
      user,
      ...tokens,
    };
  }

  async login(dto: LoginDto, ip: string | undefined) {
    const user = await this.usersService.findUserByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is inactive');

    const valid = await this.comparePassword(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = this.issueTokens(user);

    await this.auditModel.create({
      name: `${user.firstName} ${user.lastName}`,
      action: 'User logged in',
      ip,
    });

    return {
      user,
      ...tokens,
    };
  }

  issueTokens(user: any) {
    const basePayload = {
      sub: user._id.toString(),
      email: user.email,
      roles: user.roles,
      tv: user.tokenVersion,
    };

    const accessToken = this.getAccessToken(basePayload);
    const refreshToken = this.getRefreshToken({
      sub: user._id.toString(),
      tv: user.tokenVersion,
      type: 'refresh',
    });

    return { accessToken, refreshToken };
  }

  async refresh(userFromToken: { userId: string; tv: number }) {
    const user = await this.usersService.findUserById(userFromToken.userId);
    if (!user) throw new UnauthorizedException('User not found');

    if (user.tokenVersion !== userFromToken.tv) {
      throw new UnauthorizedException('Token version mismatch');
    }

    return this.issueTokens(user);
  }

  async verifyEmail(token: string) {
    try {
      const payload = this.jwt.verify(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
      // console.log(this.config.get<string>('JWT_ACCESS_SECRET'));

      if (payload.type !== 'email-verify') {
        throw new BadRequestException('Invalid token type');
      }

      await this.usersService.markUserEmailAsVerified(payload.sub);
      return { message: 'Email verified successfully' };
    } catch {
      throw new BadRequestException('Invalid or expired token');
    }
  }
}
