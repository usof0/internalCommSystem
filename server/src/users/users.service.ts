import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        secondName: true,
        lastName: true,
        displayName: true,
        avatarUrl: true,
        isActive: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findMany(params: { q?: string; skip?: number; take?: number }) {
    const { q, skip = 0, take = 20 } = params;

    const where: any = { deletedAt: null };

    if (q?.trim()) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { secondName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { displayName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          secondName: true,
          lastName: true,
          displayName: true,
          avatarUrl: true,
          isActive: true,
          isBlocked: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    firstName?: string;
    secondName?: string;
    lastName?: string;
    displayName?: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        secondName: data.secondName,
        lastName: data.lastName,
        displayName: data.displayName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        secondName: true,
        lastName: true,
        displayName: true,
        createdAt: true,
      },
    });
  }
}
