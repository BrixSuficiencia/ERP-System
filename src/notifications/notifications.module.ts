import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

/**
 * Notifications Module
 * Manages real-time notifications and WebSocket connections
 * Includes notification gateway and service for real-time communication
 */
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'jwt_secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsGateway, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
