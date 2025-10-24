import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod } from './payment.entity';
import { Order, OrderStatus } from '../orders/order.entity';
import { User, UserRole } from '../auth/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import Stripe from 'stripe';

/**
 * Payment Service
 * Handles all payment processing including multiple payment gateways
 * Supports Stripe, PayPal, and Maya payment gateways
 */
@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {
    // Initialize Stripe with secret key from environment
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-09-30.clover',
    });
  }

  /**
   * Create a new payment
   * Validates order and customer, then processes payment
   */
  async create(createPaymentDto: {
    orderId: number;
    customerId: number;
    amount: number;
    paymentMethod: PaymentMethod;
    currency?: string;
    metadata?: any;
  }): Promise<Payment> {
    const { orderId, customerId, amount, paymentMethod, currency = 'USD', metadata } = createPaymentDto;

    // Validate order exists and is payable
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['customer', 'payments'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate customer
    const customer = await this.userRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if order can be paid
    if (!this.canOrderBePaid(order)) {
      throw new BadRequestException('Order cannot be paid in current status');
    }

    // Validate payment amount
    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    // Check if payment amount doesn't exceed order amount
    const totalPaid = order.payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

    if (totalPaid + amount > parseFloat(order.finalAmount.toString())) {
      throw new BadRequestException('Payment amount exceeds remaining order balance');
    }

    // Validate full payment matches order amount (for single-payment logic)
    const remainingBalance = parseFloat(order.finalAmount.toString()) - totalPaid;
    
    console.log('Final amount:', order.finalAmount);
    console.log('Total paid so far:', totalPaid);
    console.log('Remaining balance (computed):', remainingBalance);

    if (amount < remainingBalance) {
      throw new BadRequestException(
        `Payment amount ($${amount}) does not cover remaining balance ($${remainingBalance}).`);
    }


    // Create payment record
    const payment = this.paymentRepository.create({
      orderId,
      customerId,
      amount,
      currency,
      paymentMethod,
      status: PaymentStatus.PENDING,
      metadata,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Process payment based on method
    try {
      const processedPayment = await this.processPayment(savedPayment);
      return processedPayment;
    } catch (error) {
      // Update payment status to failed
      savedPayment.status = PaymentStatus.FAILED;
      savedPayment.errorMessage = error.message;
      await this.paymentRepository.save(savedPayment);
      throw error;
    }

    return savedPayment;
  }

  /**
   * Get all payments with optional filtering
   */
  async findAll(filters?: {
    orderId?: number;
    customerId?: number;
    status?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ payments: Payment[]; total: number }> {
    const query = this.paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('payment.customer', 'customer');

    if (filters?.orderId) {
      query.andWhere('payment.orderId = :orderId', { orderId: filters.orderId });
    }

    if (filters?.customerId) {
      query.andWhere('payment.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters?.status) {
      query.andWhere('payment.status = :status', { status: filters.status });
    }

    if (filters?.paymentMethod) {
      query.andWhere('payment.paymentMethod = :paymentMethod', { paymentMethod: filters.paymentMethod });
    }

    if (filters?.startDate) {
      query.andWhere('payment.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('payment.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const total = await query.getCount();

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    query.orderBy('payment.createdAt', 'DESC');

    const payments = await query.getMany();

    return { payments, total };
  }

  /**
   * Get a single payment by ID
   */
  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order', 'customer'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  /**
   * Process payment based on payment method
   */
  private async processPayment(payment: Payment): Promise<Payment> {
    switch (payment.paymentMethod) {
      case PaymentMethod.STRIPE:
        return await this.processStripePayment(payment);
      case PaymentMethod.PAYPAL:
        await this.processPayPalPayment(payment);
        return payment;
      case PaymentMethod.MAYA:
        await this.processMayaPayment(payment);
        return payment;
      case PaymentMethod.CASH:
        await this.processCashPayment(payment);
        return payment;
      case PaymentMethod.BANK_TRANSFER:
        await this.processBankTransferPayment(payment);
        return payment;
      default:
        throw new BadRequestException('Unsupported payment method');
    }
  }

  /**
   * Process Stripe payment
   */
  private async processStripePayment(payment: Payment): Promise<Payment> {
    try {
      payment.status = PaymentStatus.PROCESSING;

      // Create Stripe payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(payment.amount * 100), // Convert to cents
        currency: payment.currency.toLowerCase(),
        metadata: {
          orderId: payment.orderId.toString(),
          customerId: payment.customerId.toString(),
          paymentId: payment.id.toString(),
        },
      });

      payment.gatewayTransactionId = paymentIntent.id;
      payment.gatewayResponse = paymentIntent;

      // For demo purposes, we'll simulate successful payment
      // In production, you would handle webhooks for actual payment confirmation
      payment.status = PaymentStatus.COMPLETED;
      payment.processedAt = new Date();

      const savedPayment = await this.paymentRepository.save(payment);

      // Send notification to customer about successful payment
      await this.notificationsService.notifyPaymentStatusUpdate(
        payment.customerId,
        payment.id,
        'COMPLETED',
        {
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          orderId: payment.orderId,
        }
      );

      return savedPayment;
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      payment.errorMessage = error.message;
      const savedPayment = await this.paymentRepository.save(payment);

      // Send notification to customer about failed payment
      await this.notificationsService.notifyPaymentStatusUpdate(
        payment.customerId,
        payment.id,
        'FAILED',
        {
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          orderId: payment.orderId,
          errorMessage: error.message,
        }
      );

      // Send notification to admins about failed payment
      await this.notificationsService.notifyFailedPayment(
        payment.id,
        payment.customerId,
        error.message,
        {
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          orderId: payment.orderId,
        }
      );

      throw error;
    }
  }

  /**
   * Process PayPal payment
   */
  private async processPayPalPayment(payment: Payment): Promise<void> {
    // PayPal integration would go here
    // For now, simulate successful payment
    payment.status = PaymentStatus.COMPLETED;
    payment.processedAt = new Date();
    payment.gatewayTransactionId = `paypal_${Date.now()}`;
    
    await this.paymentRepository.save(payment);
  }

  /**
   * Process Maya payment
   */
  private async processMayaPayment(payment: Payment): Promise<void> {
    // Maya integration would go here
    // For now, simulate successful payment
    payment.status = PaymentStatus.COMPLETED;
    payment.processedAt = new Date();
    payment.gatewayTransactionId = `maya_${Date.now()}`;
    
    await this.paymentRepository.save(payment);
  }

  /**
   * Process cash payment
   */
  private async processCashPayment(payment: Payment): Promise<void> {
    // Cash payments are typically marked as pending until confirmed
    payment.status = PaymentStatus.PENDING;
    await this.paymentRepository.save(payment);
  }

  /**
   * Process bank transfer payment
   */
  private async processBankTransferPayment(payment: Payment): Promise<void> {
    // Bank transfer payments are typically marked as pending until confirmed
    payment.status = PaymentStatus.PENDING;
    await this.paymentRepository.save(payment);
  }

  /**
   * Refund a payment
   */
  async refund(paymentId: number, amount?: number, reason?: string): Promise<Payment> {
    const payment = await this.findOne(paymentId);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new BadRequestException('Refund amount cannot exceed payment amount');
    }

    // Process refund based on payment method
    if (payment.paymentMethod === PaymentMethod.STRIPE) {
      await this.processStripeRefund(payment, refundAmount);
    } else {
      // For other payment methods, mark as refunded
      payment.status = refundAmount === payment.amount ? 
        PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
      payment.refundAmount = refundAmount;
      payment.refundedAt = new Date();
    }

    return await this.paymentRepository.save(payment);
  }

  /**
   * Process Stripe refund
   */
  private async processStripeRefund(payment: Payment, amount: number): Promise<void> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.gatewayTransactionId,
        amount: Math.round(amount * 100), // Convert to cents
      });

      payment.status = amount === payment.amount ? 
        PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
      payment.refundAmount = amount;
      payment.refundedAt = new Date();
      payment.gatewayResponse = refund;

    } catch (error) {
      throw new BadRequestException(`Stripe refund failed: ${error.message}`);
    }
  }

  /**
   * Get payment statistics
   */
  async getStatistics(): Promise<{
    totalPayments: number;
    totalAmount: number;
    averagePayment: number;
    paymentsByStatus: Record<PaymentStatus, number>;
    paymentsByMethod: Record<PaymentMethod, number>;
  }> {
    const totalPayments = await this.paymentRepository.count();
    
    const totalAmount = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .getRawOne();

    const averagePayment = totalPayments > 0 ? totalAmount.total / totalPayments : 0;

    const paymentsByStatus = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('payment.status')
      .getRawMany();

    const paymentsByMethod = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.paymentMethod', 'method')
      .addSelect('COUNT(*)', 'count')
      .groupBy('payment.paymentMethod')
      .getRawMany();

    const statusCounts = paymentsByStatus.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {} as Record<PaymentStatus, number>);

    const methodCounts = paymentsByMethod.reduce((acc, item) => {
      acc[item.method] = parseInt(item.count);
      return acc;
    }, {} as Record<PaymentMethod, number>);

    return {
      totalPayments,
      totalAmount: parseFloat(totalAmount.total) || 0,
      averagePayment,
      paymentsByStatus: statusCounts,
      paymentsByMethod: methodCounts,
    };
  }

  /**
   * Check if order can be paid
   */
  private canOrderBePaid(order: Order): boolean {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status);
  }

  /**
   * Test Stripe connection
   */
  async testStripeConnection(): Promise<{
    connected: boolean;
    account?: any;
    error?: string;
  }> {
    try {
      // Test Stripe connection by retrieving account information
      const account = await this.stripe.accounts.retrieve();
      
      return {
        connected: true,
        account: {
          id: account.id,
          type: account.type,
          country: account.country,
          email: account.email,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
        }
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}
