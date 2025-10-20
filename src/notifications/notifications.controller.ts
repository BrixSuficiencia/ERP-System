import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  UseGuards,
  Request
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/user.entity';

/**
 * Notifications Controller
 * Handles notification management and testing endpoints
 * Includes real-time notification testing and statistics
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get notification statistics
   * GET /notifications/stats
   */
  @Get('stats')
  async getStats() {
    return await this.notificationsService.getNotificationStats();
  }

  /**
   * Send system notification to specific user
   * POST /notifications/send
   */
  @Post('send')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async sendNotification(
    @Body() notificationDto: {
      userId: number;
      message: string;
      type?: 'info' | 'warning' | 'error';
    }
  ) {
    await this.notificationsService.notifySystemMessage(
      notificationDto.userId,
      notificationDto.message,
      notificationDto.type || 'info'
    );
    return { message: 'Notification sent successfully' };
  }

  /**
   * Broadcast system announcement
   * POST /notifications/broadcast
   */
  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async broadcastAnnouncement(
    @Body() announcementDto: {
      message: string;
      type?: 'info' | 'warning' | 'error';
    }
  ) {
    await this.notificationsService.broadcastSystemAnnouncement(
      announcementDto.message,
      announcementDto.type || 'info'
    );
    return { message: 'Announcement broadcasted successfully' };
  }

  /**
   * Test notification (for development)
   * POST /notifications/test
   */
  @Post('test')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async testNotification(@Request() req: any) {
    await this.notificationsService.notifySystemMessage(
      req.user.id,
      'This is a test notification from the ERP system',
      'info'
    );
    return { message: 'Test notification sent' };
  }
}
