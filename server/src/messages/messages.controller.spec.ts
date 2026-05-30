import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { TopicsService } from '../topics/topics.service';
import { RbacService } from '../rbac/rbac.service';

const mockMessagesService = {
  listMessages: jest.fn(),
  listReplies: jest.fn(),
  createMessage: jest.fn(),
  pinMessage: jest.fn(),
  getMessageTopicId: jest.fn(),
  getTopicRoomId: jest.fn(),
};
const mockTopicsService = {
  assertRoomMember: jest.fn(),
  assertTopicVisible: jest.fn(),
};
const mockRbacService = {
  userHasPermission: jest.fn(),
  userHasRoomPermission: jest.fn(),
};

describe('MessagesController', () => {
  let controller: MessagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: TopicsService, useValue: mockTopicsService },
        { provide: RbacService, useValue: mockRbacService },
      ],
    })
      .overrideGuard(require('../auth/jwt-auth.guard').JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MessagesController>(MessagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
