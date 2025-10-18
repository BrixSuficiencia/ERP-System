import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Order } from '../orders/order.entity';
import { Payment } from '../payments/payment.entity';
import { Product } from '../products/product.entity';
import { Customer } from '../customers/customer.entity';
import { User } from '../auth/user.entity';

/**
 * Dashboard Module
 * Manages comprehensive business analytics and dashboard functionality
 * Includes sales analytics, customer insights, and business metrics
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Payment, Product, Customer, User])
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
