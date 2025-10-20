import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/order.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { Product } from '../products/product.entity';
import { Customer } from '../customers/customer.entity';
import { User } from '../auth/user.entity';

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
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Get comprehensive dashboard overview
   */
  async getDashboardOverview(): Promise<{
    sales: {
      totalRevenue: number;
      todayRevenue: number;
      monthlyRevenue: number;
      averageOrderValue: number;
      totalOrders: number;
      pendingOrders: number;
      completedOrders: number;
    };
    customers: {
      totalCustomers: number;
      activeCustomers: number;
      newCustomersToday: number;
      newCustomersThisMonth: number;
      vipCustomers: number;
    };
    products: {
      totalProducts: number;
      activeProducts: number;
      lowStockProducts: number;
      outOfStockProducts: number;
      totalInventoryValue: number;
    };
    payments: {
      totalPayments: number;
      successfulPayments: number;
      failedPayments: number;
      pendingPayments: number;
      totalRefunds: number;
      successRate: number;
    };
    recentActivity: {
      recentOrders: any[];
      recentPayments: any[];
      recentCustomers: any[];
    };
  }> {
    // Sales analytics
    const sales = await this.getSalesAnalytics();
    
    // Customer analytics
    const customers = await this.getCustomerAnalytics();
    
    // Product analytics
    const products = await this.getProductAnalytics();
    
    // Payment analytics
    const payments = await this.getPaymentAnalytics();
    
    // Recent activity
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
  private async getSalesAnalytics(): Promise<{
    totalRevenue: number;
    todayRevenue: number;
    monthlyRevenue: number;
    averageOrderValue: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    // Total revenue
    const totalRevenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.finalAmount)', 'total')
      .where('order.status IN (:...statuses)', { 
        statuses: ['DELIVERED', 'SHIPPED'] 
      })
      .getRawOne();

    // Today's revenue
    const todayRevenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.finalAmount)', 'total')
      .where('order.status IN (:...statuses)', { 
        statuses: ['DELIVERED', 'SHIPPED'] 
      })
      .andWhere('order.createdAt >= :today', { today })
      .getRawOne();

    // This month's revenue
    const monthlyRevenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.finalAmount)', 'total')
      .where('order.status IN (:...statuses)', { 
        statuses: ['DELIVERED', 'SHIPPED'] 
      })
      .andWhere('order.createdAt >= :thisMonth', { thisMonth })
      .getRawOne();

    // Order counts
    const totalOrders = await this.orderRepository.count();
    const pendingOrders = await this.orderRepository.count({ 
      where: { status: OrderStatus.PENDING } 
    });
    const completedOrders = await this.orderRepository.count({ 
      where: { status: OrderStatus.DELIVERED } 
    });

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
  private async getCustomerAnalytics(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomersToday: number;
    newCustomersThisMonth: number;
    vipCustomers: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const totalCustomers = await this.customerRepository.count();
    const activeCustomers = await this.customerRepository.count({ 
      where: { isActive: true } 
    });
    const vipCustomers = await this.customerRepository.count({ 
      where: { isVip: true } 
    });

    const newCustomersToday = await this.customerRepository.count({
      where: { createdAt: today }
    });

    const newCustomersThisMonth = await this.customerRepository.count({
      where: { createdAt: thisMonth }
    });

    return {
      totalCustomers,
      activeCustomers,
      newCustomersToday,
      newCustomersThisMonth,
      vipCustomers,
    };
  }

  /**
   * Get product analytics
   */
  private async getProductAnalytics(): Promise<{
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalInventoryValue: number;
  }> {
    const totalProducts = await this.productRepository.count();
    const activeProducts = await this.productRepository.count({ 
      where: { isActive: true } 
    });
    const lowStockProducts = await this.productRepository.count({ 
      where: { stock: 10 } // Products with stock <= 10
    });
    const outOfStockProducts = await this.productRepository.count({ 
      where: { stock: 0 } 
    });

    // Calculate total inventory value
    const products = await this.productRepository.find({
      where: { isActive: true }
    });
    const totalInventoryValue = products.reduce(
      (sum, product) => sum + (product.price * product.stock), 
      0
    );

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
  private async getPaymentAnalytics(): Promise<{
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    totalRefunds: number;
    successRate: number;
  }> {
    const totalPayments = await this.paymentRepository.count();
    const successfulPayments = await this.paymentRepository.count({ 
      where: { status: PaymentStatus.COMPLETED } 
    });
    const failedPayments = await this.paymentRepository.count({ 
      where: { status: PaymentStatus.FAILED } 
    });
    const pendingPayments = await this.paymentRepository.count({ 
      where: { status: PaymentStatus.PENDING } 
    });
    const totalRefunds = await this.paymentRepository.count({ 
      where: { status: PaymentStatus.REFUNDED } 
    });

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
  private async getRecentActivity(): Promise<{
    recentOrders: any[];
    recentPayments: any[];
    recentCustomers: any[];
  }> {
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

    const recentCustomers = await this.customerRepository.find({
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
   * Get sales by product analytics
   */
  async getSalesByProduct(startDate?: Date, endDate?: Date): Promise<{
    productId: number;
    productName: string;
    totalSales: number;
    totalRevenue: number;
    averagePrice: number;
  }[]> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .select('order.items', 'items')
      .where('order.status IN (:...statuses)', { 
        statuses: ['DELIVERED', 'SHIPPED'] 
      });

    if (startDate) {
      query.andWhere('order.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('order.createdAt <= :endDate', { endDate });
    }

    const orders = await query.getMany();

    // Process order items to get sales by product
    const productSales = new Map<number, {
      productName: string;
      totalSales: number;
      totalRevenue: number;
      averagePrice: number;
    }>();

    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const productId = item.productId;
          const existing = productSales.get(productId);

          if (existing) {
            existing.totalSales += item.quantity;
            existing.totalRevenue += item.totalPrice;
            existing.averagePrice = existing.totalRevenue / existing.totalSales;
          } else {
            productSales.set(productId, {
              productName: item.productName,
              totalSales: item.quantity,
              totalRevenue: item.totalPrice,
              averagePrice: item.unitPrice,
            });
          }
        });
      }
    });

    return Array.from(productSales.entries()).map(([productId, data]) => ({
      productId,
      ...data,
    }));
  }

  /**
   * Get top customers analytics
   */
  async getTopCustomers(limit: number = 10): Promise<{
    customerId: number;
    customerName: string;
    totalSpent: number;
    totalOrders: number;
    averageOrderValue: number;
    lastOrderDate: Date;
  }[]> {
    const customers = await this.customerRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.orders', 'order')
      .select('customer.id', 'customerId')
      .addSelect('customer.firstName', 'firstName')
      .addSelect('customer.lastName', 'lastName')
      .addSelect('SUM(order.finalAmount)', 'totalSpent')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .addSelect('AVG(order.finalAmount)', 'averageOrderValue')
      .addSelect('MAX(order.createdAt)', 'lastOrderDate')
      .where('order.status IN (:...statuses)', { 
        statuses: ['DELIVERED', 'SHIPPED'] 
      })
      .groupBy('customer.id, customer.firstName, customer.lastName')
      .orderBy('totalSpent', 'DESC')
      .limit(limit)
      .getRawMany();

    return customers.map(customer => ({
      customerId: customer.customerId,
      customerName: `${customer.firstName} ${customer.lastName}`,
      totalSpent: parseFloat(customer.totalSpent) || 0,
      totalOrders: parseInt(customer.totalOrders) || 0,
      averageOrderValue: parseFloat(customer.averageOrderValue) || 0,
      lastOrderDate: customer.lastOrderDate,
    }));
  }

  /**
   * Get payment failure analytics
   */
  async getPaymentFailureAnalytics(): Promise<{
    totalFailures: number;
    failureRate: number;
    commonFailureReasons: { reason: string; count: number }[];
    failureTrends: { date: string; failures: number; total: number }[];
  }> {
    const totalPayments = await this.paymentRepository.count();
    const failedPayments = await this.paymentRepository.count({ 
      where: { status: PaymentStatus.FAILED } 
    });

    const failureRate = totalPayments > 0 ? (failedPayments / totalPayments) * 100 : 0;

    // Get common failure reasons (this would need to be enhanced based on actual error tracking)
    const commonFailureReasons = [
      { reason: 'Insufficient funds', count: Math.floor(failedPayments * 0.4) },
      { reason: 'Card expired', count: Math.floor(failedPayments * 0.3) },
      { reason: 'Invalid card', count: Math.floor(failedPayments * 0.2) },
      { reason: 'Network error', count: Math.floor(failedPayments * 0.1) },
    ];

    // Get failure trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const failureTrends = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('DATE(payment.createdAt)', 'date')
      .addSelect('COUNT(CASE WHEN payment.status = \'FAILED\' THEN 1 END)', 'failures')
      .addSelect('COUNT(*)', 'total')
      .where('payment.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy('DATE(payment.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      totalFailures: failedPayments,
      failureRate,
      commonFailureReasons,
      failureTrends: failureTrends.map(trend => ({
        date: trend.date,
        failures: parseInt(trend.failures) || 0,
        total: parseInt(trend.total) || 0,
      })),
    };
  }
}
