
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './order.entity';
import { Product } from '../products/product.entity';
import { User } from '../auth/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Orders Module
 * Manages order-related functionality
 * Includes order CRUD operations, status management, and order processing
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product, User]),
    NotificationsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
