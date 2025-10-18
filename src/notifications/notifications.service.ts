import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

/**
 * Notification Service
 * Handles business logic for notifications and real-time updates
 * Integrates with the WebSocket gateway for real-time communication
 */
@Injectable()
export class NotificationsService {
  constructor(private notificationsGateway: NotificationsGateway) {}

  /**
   * Send order status update notification
   */
  async notifyOrderStatusUpdate(
    userId: number,
    orderId: number,
    status: string,
    orderDetails: any
  ): Promise<void> {
    this.notificationsGateway.notifyOrderStatusUpdate(userId, orderId, status, orderDetails);
  }

  /**
   * Send payment status update notification
   */
  async notifyPaymentStatusUpdate(
    userId: number,
    paymentId: number,
    status: string,
    paymentDetails: any
  ): Promise<void> {
    this.notificationsGateway.notifyPaymentStatusUpdate(userId, paymentId, status, paymentDetails);
  }

  /**
   * Send new order notification to admins
   */
  async notifyNewOrder(
    orderId: number,
    customerId: number,
    orderDetails: any
  ): Promise<void> {
    this.notificationsGateway.notifyNewOrder(orderId, customerId, orderDetails);
  }

  /**
   * Send failed payment notification to admins
   */
  async notifyFailedPayment(
    paymentId: number,
    customerId: number,
    reason: string,
    paymentDetails: any
  ): Promise<void> {
    this.notificationsGateway.notifyFailedPayment(paymentId, customerId, reason, paymentDetails);
  }

  /**
   * Send system notification to specific user
   */
  async notifySystemMessage(
    userId: number,
    message: string,
    type: 'info' | 'warning' | 'error' = 'info'
  ): Promise<void> {
    this.notificationsGateway.notifySystemMessage(userId, message, type);
  }

  /**
   * Broadcast system announcement to all users
   */
  async broadcastSystemAnnouncement(
    message: string,
    type: 'info' | 'warning' | 'error' = 'info'
  ): Promise<void> {
    this.notificationsGateway.broadcastSystemAnnouncement(message, type);
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(): {
    connectedClients: number;
    adminClients: number;
    isOnline: boolean;
  } {
    return {
      connectedClients: this.notificationsGateway.getConnectedClientsCount(),
      adminClients: this.notificationsGateway.getAdminClientsCount(),
      isOnline: this.notificationsGateway.getConnectedClientsCount() > 0,
    };
  }
}
