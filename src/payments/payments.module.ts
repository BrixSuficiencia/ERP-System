import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './payment.entity';
import { Order } from '../orders/order.entity';
import { Customer } from '../customers/customer.entity';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Payments Module
 * Manages payment-related functionality
 * Includes payment processing, gateway integration, and refund handling
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order, Customer]),
    NotificationsModule
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService], // Export service for use in other modules
})
export class PaymentsModule {}
