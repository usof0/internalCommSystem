import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  private signAccessToken(payload: { sub: string; email: string }) {
    return this.jwt.sign(payload);
  }

  async register(dto: {
    email: string;
    password: string;
    firstName?: string;
    secondName?: string;
    lastName?: string;
    displayName?: string;
  }) {
    const email = normalizeEmail(dto.email);

    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.users.createUser({
      email,
      passwordHash,
      firstName: dto.firstName,
      secondName: dto.secondName,
      lastName: dto.lastName,
      displayName: dto.displayName,
    });

    const accessToken = this.signAccessToken({
      sub: user.id,
      email: user.email,
    });
    return { user, accessToken };
  }

  async login(dto: { email: string; password: string }) {
    const email = normalizeEmail(dto.email);

    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.deletedAt) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive || user.isBlocked)
      throw new ForbiddenException('Account is disabled');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.signAccessToken({
      sub: user.id,
      email: user.email,
    });
    return { accessToken };
  }
}
