import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from '../orders/order.entity';
import { User } from '../auth/user.entity';

/**
 * Payment status enumeration
 * Tracks the status of payment processing
 */
export enum PaymentStatus {
  PENDING = 'PENDING',           // Payment initiated but not yet processed
  PROCESSING = 'PROCESSING',     // Payment is being processed by gateway
  COMPLETED = 'COMPLETED',       // Payment successfully completed
  FAILED = 'FAILED',            // Payment failed
  CANCELLED = 'CANCELLED',       // Payment was cancelled
  REFUNDED = 'REFUNDED',         // Payment has been refunded
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED' // Payment partially refunded
}

/**
 * Payment method enumeration
 * Supported payment gateways and methods
 */
export enum PaymentMethod {
  STRIPE = 'STRIPE',             // Stripe payment gateway
  PAYPAL = 'PAYPAL',             // PayPal payment gateway
  MAYA = 'MAYA',                 // Maya payment gateway (Philippines)
  CASH = 'CASH',                 // Cash on delivery
  BANK_TRANSFER = 'BANK_TRANSFER' // Bank transfer
}

/**
 * Payment Entity
 * Represents a payment transaction for an order
 * Supports multiple payment gateways and methods
 */
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Reference to the order being paid
   */
  @ManyToOne(() => Order, order => order.payments, { eager: true })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: number;

  /**
   * Customer who made the payment
   */
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column()
  customerId: number;

  /**
   * Amount of the payment
   */
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  /**
   * Currency code (ISO 4217)
   */
  @Column({ default: 'USD' })
  currency: string;

  /**
   * Payment method used
   */
  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  /**
   * Current status of the payment
   */
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  /**
   * External payment gateway transaction ID
   * Used to track payments with third-party services
   */
  @Column({ nullable: true })
  gatewayTransactionId: string;

  /**
   * External payment gateway reference
   * Additional reference from payment gateway
   */
  @Column({ nullable: true })
  gatewayReference: string;

  /**
   * Payment gateway response data
   * Stores raw response from payment gateway for debugging
   */
  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse: any;

  /**
   * Error message if payment failed
   */
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  /**
   * Payment processing fee charged by gateway
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  processingFee: number;

  /**
   * Refund amount if applicable
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  refundAmount: number;

  /**
   * Date when payment was processed
   */
  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  /**
   * Date when payment was refunded
   */
  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date;

  /**
   * Additional metadata for the payment
   * Can store custom fields specific to payment method
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
