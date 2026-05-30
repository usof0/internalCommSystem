import { Test, TestingModule } from '@nestjs/testing';
import { TopicsService } from './topics.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrgUnitsService } from '../org-units/org-units.service';

const mockPrisma = {
  topic: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  room: { findUnique: jest.fn() },
  userRoomMembership: { findUnique: jest.fn() },
  topicVisibilityScope: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
  topicVisibilityMember: { createMany: jest.fn(), deleteMany: jest.fn() },
  topicVisibilityOrgUnit: { createMany: jest.fn(), deleteMany: jest.fn() },
  topicVisibilityOrgUnitTag: { createMany: jest.fn(), deleteMany: jest.fn() },
  userOrgUnitMembership: { findFirst: jest.fn() },
  orgUnitTag: { findMany: jest.fn() },
  message: { updateMany: jest.fn() },
  $transaction: jest.fn((ops: any) => Array.isArray(ops) ? Promise.all(ops) : ops(mockPrisma)),
};
const mockOrg = { getSubtreeIds: jest.fn() };

describe('TopicsService', () => {
  let service: TopicsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OrgUnitsService, useValue: mockOrg },
      ],
    }).compile();

    service = module.get<TopicsService>(TopicsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
