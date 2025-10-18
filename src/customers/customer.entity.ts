import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Order } from '../orders/order.entity';

/**
 * Customer Entity
 * Represents a customer in the ERP system
 * Separate from User entity to handle customer-specific data
 */
@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Customer's first name
   */
  @Column()
  firstName: string;

  /**
   * Customer's last name
   */
  @Column()
  lastName: string;

  /**
   * Customer's email address (unique)
   */
  @Column({ unique: true })
  email: string;

  /**
   * Customer's phone number
   */
  @Column({ nullable: true })
  phone: string;

  /**
   * Customer's date of birth
   */
  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  /**
   * Customer's company name (for business customers)
   */
  @Column({ nullable: true })
  company: string;

  /**
   * Customer's tax ID or business registration number
   */
  @Column({ nullable: true })
  taxId: string;

  /**
   * Default shipping address
   */
  @Column({ type: 'text', nullable: true })
  defaultShippingAddress: string;

  /**
   * Default billing address
   */
  @Column({ type: 'text', nullable: true })
  defaultBillingAddress: string;

  /**
   * Customer's preferred language
   */
  @Column({ default: 'en' })
  preferredLanguage: string;

  /**
   * Customer's preferred currency
   */
  @Column({ default: 'USD' })
  preferredCurrency: string;

  /**
   * Customer's timezone
   */
  @Column({ default: 'UTC' })
  timezone: string;

  /**
   * Customer's credit limit
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  creditLimit: number;

  /**
   * Customer's current balance (outstanding amount)
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  currentBalance: number;

  /**
   * Customer's loyalty points
   */
  @Column({ default: 0 })
  loyaltyPoints: number;

  /**
   * Customer's status
   */
  @Column({ default: true })
  isActive: boolean;

  /**
   * Customer's VIP status
   */
  @Column({ default: false })
  isVip: boolean;

  /**
   * Customer's preferred payment method
   */
  @Column({ nullable: true })
  preferredPaymentMethod: string;

  /**
   * Customer's notes (internal use)
   */
  @Column({ type: 'text', nullable: true })
  notes: string;

  /**
   * All orders placed by this customer
   */
  @OneToMany(() => Order, order => order.customer)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Get customer's full name
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
