import { Test, TestingModule } from '@nestjs/testing';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { Reflector } from '@nestjs/core';

const mockTopicsService = {
  listTopics: jest.fn(),
  createTopic: jest.fn(),
  updateTopic: jest.fn(),
  deleteTopic: jest.fn(),
  getVisibilityScope: jest.fn(),
  setVisibilityScope: jest.fn(),
  patchVisibilityScope: jest.fn(),
  assertRoomMember: jest.fn(),
};

describe('TopicsController', () => {
  let controller: TopicsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TopicsController],
      providers: [
        { provide: TopicsService, useValue: mockTopicsService },
        Reflector,
      ],
    })
      .overrideGuard(require('../auth/jwt-auth.guard').JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(require('../rbac/guards/chat-permission.guard').ChatPermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TopicsController>(TopicsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
