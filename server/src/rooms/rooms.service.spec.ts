import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrgUnitsService } from '../org-units/org-units.service';

const mockPrisma = {
  room: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  userRoomMembership: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), createMany: jest.fn(), update: jest.fn(), delete: jest.fn(), deleteMany: jest.fn(), count: jest.fn() },
  roomRole: { findUnique: jest.fn() },
  user: { findMany: jest.fn(), findUnique: jest.fn() },
  topic: { create: jest.fn() },
  topicVisibilityScope: { create: jest.fn() },
  $transaction: jest.fn((cb: any) => cb(mockPrisma)),
};

const mockOrg = { resolveByOrgIds: jest.fn() };

describe('RoomsService', () => {
  let service: RoomsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OrgUnitsService, useValue: mockOrg },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
