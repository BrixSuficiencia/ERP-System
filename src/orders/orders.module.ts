import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './order.entity';
import { Product } from '../products/product.entity';
import { Customer } from '../customers/customer.entity';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Orders Module
 * Manages order-related functionality
 * Includes order CRUD operations, status management, and order processing
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product, Customer]),
    NotificationsModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService], // Export service for use in other modules
})
export class OrdersModule {}
