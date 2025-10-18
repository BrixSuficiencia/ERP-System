import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../auth/user.entity';
import { Payment } from '../payments/payment.entity';

/**
 * Order status enumeration
 * Tracks the lifecycle of an order from creation to completion
 */
export enum OrderStatus {
  PENDING = 'PENDING',           // Order created but not yet processed
  CONFIRMED = 'CONFIRMED',       // Order confirmed and being prepared
  SHIPPED = 'SHIPPED',           // Order has been shipped
  DELIVERED = 'DELIVERED',       // Order has been delivered
  CANCELLED = 'CANCELLED',       // Order has been cancelled
  REFUNDED = 'REFUNDED'          // Order has been refunded
}

/**
 * Order Entity
 * Represents a customer order containing multiple products
 * Each order belongs to a customer and can have multiple payments
 */
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Unique order number for customer reference
   * Format: ORD-YYYYMMDD-XXXXXX
   */
  @Column({ unique: true })
  orderNumber: string;

  /**
   * Reference to the customer who placed the order
   */
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column()
  customerId: number;

  /**
   * Current status of the order
   */
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  /**
   * Total amount of the order (sum of all order items)
   */
  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  /**
   * Tax amount applied to the order
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  /**
   * Shipping cost for the order
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  shippingCost: number;

  /**
   * Discount amount applied to the order
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  /**
   * Final amount after all calculations (total + tax + shipping - discount)
   */
  @Column('decimal', { precision: 10, scale: 2 })
  finalAmount: number;

  /**
   * Customer's shipping address
   */
  @Column({ type: 'text' })
  shippingAddress: string;

  /**
   * Customer's billing address
   */
  @Column({ type: 'text' })
  billingAddress: string;

  /**
   * Special notes or instructions for the order
   */
  @Column({ type: 'text', nullable: true })
  notes: string;

  /**
   * Reason for order cancellation
   */
  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  /**
   * Expected delivery date
   */
  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate: Date;

  /**
   * Actual delivery date
   */
  @Column({ type: 'date', nullable: true })
  deliveredDate: Date;

  /**
   * All payments associated with this order
   */
  @OneToMany(() => Payment, payment => payment.order)
  payments: Payment[];

  /**
   * Order items stored as JSON
   * Format: [{ productId, quantity, price, total }]
   */
  @Column({ type: 'jsonb' })
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
