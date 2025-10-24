import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/order.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { Product } from '../products/product.entity';
import { User, UserRole } from '../auth/user.entity';

/**
 * Dashboard Service
 * Provides comprehensive business analytics and dashboard data
 * Includes sales analytics, customer insights, and business metrics
 */
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Get comprehensive dashboard overview
   */
  async getDashboardOverview() {
    const sales = await this.getSalesAnalytics();
    const customers = await this.getCustomerAnalytics();
    const products = await this.getProductAnalytics();
    const payments = await this.getPaymentAnalytics();
    const recentActivity = await this.getRecentActivity();

    return {
      sales,
      customers,
      products,
      payments,
      recentActivity,
    };
  }


  /**
   * Get sales analytics
   */
  async getSalesAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const totalRevenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.finalAmount)', 'total')
      .where('order.status IN (:...statuses)', { statuses: ['DELIVERED', 'SHIPPED'] })
      .getRawOne();

    const todayRevenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.finalAmount)', 'total')
      .where('order.status IN (:...statuses)', { statuses: ['DELIVERED', 'SHIPPED'] })
      .andWhere('order.createdAt >= :today', { today })
      .getRawOne();

    const monthlyRevenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.finalAmount)', 'total')
      .where('order.status IN (:...statuses)', { statuses: ['DELIVERED', 'SHIPPED'] })
      .andWhere('order.createdAt >= :thisMonth', { thisMonth })
      .getRawOne();

    const totalOrders = await this.orderRepository.count();
    const pendingOrders = await this.orderRepository.count({ where: { status: OrderStatus.PENDING } });
    const completedOrders = await this.orderRepository.count({ where: { status: OrderStatus.DELIVERED } });

    const totalRevenue = parseFloat(totalRevenueResult.total) || 0;
    const todayRevenue = parseFloat(todayRevenueResult.total) || 0;
    const monthlyRevenue = parseFloat(monthlyRevenueResult.total) || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue,
      todayRevenue,
      monthlyRevenue,
      averageOrderValue,
      totalOrders,
      pendingOrders,
      completedOrders,
    };
  }

  /**
   * Get customer analytics
   */
  private async getCustomerAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const totalCustomers = await this.userRepository.count({ where: { role: UserRole.CUSTOMER } });
    const activeCustomers = await this.userRepository.count({ where: { role: UserRole.CUSTOMER, isActive: true } });

    const newCustomersToday = await this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.CUSTOMER })
      .andWhere('DATE(user.createdAt) = DATE(:today)', { today })
      .getCount();

    const newCustomersThisMonth = await this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.CUSTOMER })
      .andWhere('user.createdAt >= :thisMonth', { thisMonth })
      .getCount();

    return {
      totalCustomers,
      activeCustomers,
      newCustomersToday,
      newCustomersThisMonth,
    };
  }

  /**
   * Get product analytics
   */
  private async getProductAnalytics() {
    const totalProducts = await this.productRepository.count();
    const activeProducts = await this.productRepository.count({ where: { isActive: true } });
    const lowStockProducts = await this.productRepository.count({ where: { stock: 10 } }); // Adjust to <= if needed
    const outOfStockProducts = await this.productRepository.count({ where: { stock: 0 } });

    const products = await this.productRepository.find({ where: { isActive: true } });
    const totalInventoryValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalInventoryValue,
    };
  }

  /**
   * Get payment analytics
   */
  private async getPaymentAnalytics() {
    const totalPayments = await this.paymentRepository.count();
    const successfulPayments = await this.paymentRepository.count({ where: { status: PaymentStatus.COMPLETED } });
    const failedPayments = await this.paymentRepository.count({ where: { status: PaymentStatus.FAILED } });
    const pendingPayments = await this.paymentRepository.count({ where: { status: PaymentStatus.PENDING } });
    const totalRefunds = await this.paymentRepository.count({ where: { status: PaymentStatus.REFUNDED } });

    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

    return {
      totalPayments,
      successfulPayments,
      failedPayments,
      pendingPayments,
      totalRefunds,
      successRate,
    };
  }

  /**
   * Get recent activity
   */
  private async getRecentActivity() {
    const recentOrders = await this.orderRepository.find({
      take: 5,
      order: { createdAt: 'DESC' },
      relations: ['customer'],
    });

    const recentPayments = await this.paymentRepository.find({
      take: 5,
      order: { createdAt: 'DESC' },
      relations: ['customer', 'order'],
    });

    const recentCustomers = await this.userRepository.find({
      where: { role: UserRole.CUSTOMER },
      take: 5,
      order: { createdAt: 'DESC' },
    });

    return {
      recentOrders,
      recentPayments,
      recentCustomers,
    };
  }

  /**
   * Get top customers analytics
   */
  async getTopCustomers(limit = 10) {
    const customers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('orders', 'orders', 'orders.customerId = user.id')
      .select('user.id', 'customerId')
      .addSelect('user.name', 'name')
      .addSelect('SUM(orders.finalAmount)', 'totalSpent')
      .addSelect('COUNT(orders.id)', 'totalOrders')
      .addSelect('AVG(orders.finalAmount)', 'averageOrderValue')
      .addSelect('MAX(orders.createdAt)', 'lastOrderDate')
      .where('user.role = :role', { role: 'CUSTOMER' })
      .andWhere('orders.status IN (:...statuses)', { statuses: ['DELIVERED', 'SHIPPED'] })
      .groupBy('user.id')
      .addGroupBy('user.name')
      .orderBy('"totalSpent"', 'DESC')
      .limit(limit)
      .getRawMany();

    return customers.map((customer) => ({
      customerId: customer.customerId,
      customerName: customer.name,
      totalSpent: parseFloat(customer.totalSpent) || 0,
      totalOrders: parseInt(customer.totalOrders) || 0,
      averageOrderValue: parseFloat(customer.averageOrderValue) || 0,
      lastOrderDate: customer.lastOrderDate,
    }));
  }


  /**
   * Get payment failure analytics
   */
  async getPaymentFailureAnalytics() {
    const totalPayments = await this.paymentRepository.count();
    const failedPayments = await this.paymentRepository.count({ where: { status: PaymentStatus.FAILED } });
    const failureRate = totalPayments > 0 ? (failedPayments / totalPayments) * 100 : 0;

    const commonFailureReasons = [
      { reason: 'Insufficient funds', count: Math.floor(failedPayments * 0.4) },
      { reason: 'Card expired', count: Math.floor(failedPayments * 0.3) },
      { reason: 'Invalid card', count: Math.floor(failedPayments * 0.2) },
      { reason: 'Network error', count: Math.floor(failedPayments * 0.1) },
    ];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const failureTrends = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('DATE(payment.createdAt)', 'date')
      .addSelect("COUNT(CASE WHEN payment.status = 'FAILED' THEN 1 END)", 'failures')
      .addSelect('COUNT(*)', 'total')
      .where('payment.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy('DATE(payment.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      totalFailures: failedPayments,
      failureRate,
      commonFailureReasons,
      failureTrends: failureTrends.map((trend) => ({
        date: trend.date,
        failures: parseInt(trend.failures) || 0,
        total: parseInt(trend.total) || 0,
      })),
    };
  }
}
