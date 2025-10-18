import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../auth/user.entity';

/**
 * Notification Gateway
 * Handles real-time WebSocket connections for notifications
 * Supports both customer and admin notifications
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Store connected clients by user ID
  private connectedClients = new Map<number, Socket>();
  private adminClients = new Set<Socket>();

  constructor(private jwtService: JwtService) {}

  /**
   * Handle new client connections
   */
  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake auth or query
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token as string);
      const userId = payload.id;
      const userRole = payload.role;

      // Store client connection
      this.connectedClients.set(userId, client);

      // If admin, add to admin clients set
      if (userRole === UserRole.ADMIN) {
        this.adminClients.add(client);
      }

      // Join user to their personal room
      client.join(`user_${userId}`);

      // If admin, join admin room
      if (userRole === UserRole.ADMIN) {
        client.join('admin_room');
      }

      console.log(`User ${userId} connected to notifications`);
    } catch (error) {
      console.error('Invalid token:', error);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnections
   */
  handleDisconnect(client: Socket) {
    // Remove from connected clients
    for (const [userId, socket] of this.connectedClients.entries()) {
      if (socket === client) {
        this.connectedClients.delete(userId);
        break;
      }
    }

    // Remove from admin clients
    this.adminClients.delete(client);

    console.log('Client disconnected from notifications');
  }

  /**
   * Send notification to specific user
   */
  sendToUser(userId: number, event: string, data: any) {
    const client = this.connectedClients.get(userId);
    if (client) {
      client.emit(event, data);
    }
  }

  /**
   * Send notification to all admins
   */
  sendToAdmins(event: string, data: any) {
    this.server.to('admin_room').emit(event, data);
  }

  /**
   * Send notification to all connected clients
   */
  sendToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  /**
   * Order status update notification
   */
  notifyOrderStatusUpdate(userId: number, orderId: number, status: string, orderDetails: any) {
    this.sendToUser(userId, 'order_status_update', {
      orderId,
      status,
      orderDetails,
      timestamp: new Date(),
    });

    // Also notify admins
    this.sendToAdmins('order_status_changed', {
      userId,
      orderId,
      status,
      orderDetails,
      timestamp: new Date(),
    });
  }

  /**
   * Payment status update notification
   */
  notifyPaymentStatusUpdate(userId: number, paymentId: number, status: string, paymentDetails: any) {
    this.sendToUser(userId, 'payment_status_update', {
      paymentId,
      status,
      paymentDetails,
      timestamp: new Date(),
    });

    // Also notify admins
    this.sendToAdmins('payment_status_changed', {
      userId,
      paymentId,
      status,
      paymentDetails,
      timestamp: new Date(),
    });
  }

  /**
   * New order notification for admins
   */
  notifyNewOrder(orderId: number, customerId: number, orderDetails: any) {
    this.sendToAdmins('new_order', {
      orderId,
      customerId,
      orderDetails,
      timestamp: new Date(),
    });
  }

  /**
   * Failed payment notification for admins
   */
  notifyFailedPayment(paymentId: number, customerId: number, reason: string, paymentDetails: any) {
    this.sendToAdmins('payment_failed', {
      paymentId,
      customerId,
      reason,
      paymentDetails,
      timestamp: new Date(),
    });
  }

  /**
   * System notification
   */
  notifySystemMessage(userId: number, message: string, type: 'info' | 'warning' | 'error' = 'info') {
    this.sendToUser(userId, 'system_notification', {
      message,
      type,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast system announcement
   */
  broadcastSystemAnnouncement(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    this.sendToAll('system_announcement', {
      message,
      type,
      timestamp: new Date(),
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get admin clients count
   */
  getAdminClientsCount(): number {
    return this.adminClients.size;
  }
}
