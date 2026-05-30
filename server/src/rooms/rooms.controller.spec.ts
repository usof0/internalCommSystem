import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { Reflector } from '@nestjs/core';

const mockRoomsService = {
  listRooms: jest.fn(),
  getRoom: jest.fn(),
  createRoom: jest.fn(),
  updateRoom: jest.fn(),
  deleteRoom: jest.fn(),
  listMembers: jest.fn(),
  addMember: jest.fn(),
  batchAddMembers: jest.fn(),
  updateMemberRole: jest.fn(),
  removeMember: jest.fn(),
  bulkAddMembers: jest.fn(),
  bulkRemoveMembers: jest.fn(),
  assertRoomMember: jest.fn(),
};

describe('RoomsController', () => {
  let controller: RoomsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        { provide: RoomsService, useValue: mockRoomsService },
        Reflector,
      ],
    })
      .overrideGuard(require('../auth/jwt-auth.guard').JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(require('../rbac/guards/chat-permission.guard').ChatPermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RoomsController>(RoomsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
