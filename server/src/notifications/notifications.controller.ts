import {
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Req() req: any, @Query() query: ListNotificationsQueryDto) {
    return this.notifications.list(req.user.id, query);
  }

  @Post('read-all')
  @HttpCode(200)
  markAllRead(@Req() req: any) {
    return this.notifications.markAllRead(req.user.id);
  }

  @Patch(':notificationId/read')
  markRead(@Req() req: any, @Param('notificationId') notificationId: string) {
    return this.notifications.markRead(req.user.id, notificationId);
  }

  @Patch(':notificationId/hide')
  hide(@Req() req: any, @Param('notificationId') notificationId: string) {
    return this.notifications.hide(req.user.id, notificationId);
  }
}
