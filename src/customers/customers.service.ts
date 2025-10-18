import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';

/**
 * Customer Service
 * Handles all business logic related to customer management
 * Includes CRUD operations and customer-specific business logic
 */
@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  /**
   * Create a new customer
   */
  async create(createCustomerDto: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: Date;
    company?: string;
    taxId?: string;
    defaultShippingAddress?: string;
    defaultBillingAddress?: string;
    preferredLanguage?: string;
    preferredCurrency?: string;
    timezone?: string;
    creditLimit?: number;
    isActive?: boolean;
    isVip?: boolean;
    preferredPaymentMethod?: string;
    notes?: string;
  }): Promise<Customer> {
    // Check if customer with email already exists
    const existingCustomer = await this.customerRepository.findOne({
      where: { email: createCustomerDto.email }
    });

    if (existingCustomer) {
      throw new BadRequestException('Customer with this email already exists');
    }

    const customer = this.customerRepository.create(createCustomerDto);
    return await this.customerRepository.save(customer);
  }

  /**
   * Get all customers with optional filtering
   */
  async findAll(filters?: {
    isActive?: boolean;
    isVip?: boolean;
    company?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ customers: Customer[]; total: number }> {
    const query = this.customerRepository.createQueryBuilder('customer');

    if (filters?.isActive !== undefined) {
      query.andWhere('customer.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters?.isVip !== undefined) {
      query.andWhere('customer.isVip = :isVip', { isVip: filters.isVip });
    }

    if (filters?.company) {
      query.andWhere('customer.company ILIKE :company', { company: `%${filters.company}%` });
    }

    if (filters?.search) {
      query.andWhere(
        '(customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.email ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const total = await query.getCount();

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    query.orderBy('customer.createdAt', 'DESC');

    const customers = await query.getMany();

    return { customers, total };
  }

  /**
   * Get a single customer by ID
   */
  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['orders'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  /**
   * Get customer by email
   */
  async findByEmail(email: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { email },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  /**
   * Update customer information
   */
  async update(id: number, updateCustomerDto: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: Date;
    company?: string;
    taxId?: string;
    defaultShippingAddress?: string;
    defaultBillingAddress?: string;
    preferredLanguage?: string;
    preferredCurrency?: string;
    timezone?: string;
    creditLimit?: number;
    isActive?: boolean;
    isVip?: boolean;
    preferredPaymentMethod?: string;
    notes?: string;
  }): Promise<Customer> {
    const customer = await this.findOne(id);

    // Check if email is being changed and if it already exists
    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existingCustomer = await this.customerRepository.findOne({
        where: { email: updateCustomerDto.email }
      });

      if (existingCustomer) {
        throw new BadRequestException('Customer with this email already exists');
      }
    }

    Object.assign(customer, updateCustomerDto);
    return await this.customerRepository.save(customer);
  }

  /**
   * Update customer balance
   */
  async updateBalance(id: number, amount: number): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.currentBalance += amount;
    return await this.customerRepository.save(customer);
  }

  /**
   * Add loyalty points
   */
  async addLoyaltyPoints(id: number, points: number): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.loyaltyPoints += points;
    return await this.customerRepository.save(customer);
  }

  /**
   * Deactivate customer
   */
  async deactivate(id: number): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.isActive = false;
    return await this.customerRepository.save(customer);
  }

  /**
   * Activate customer
   */
  async activate(id: number): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.isActive = true;
    return await this.customerRepository.save(customer);
  }

  /**
   * Delete customer (soft delete)
   */
  async remove(id: number): Promise<void> {
    const customer = await this.findOne(id);
    customer.isActive = false;
    await this.customerRepository.save(customer);
  }

  /**
   * Get customer statistics
   */
  async getStatistics(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    vipCustomers: number;
    averageOrderValue: number;
    totalRevenue: number;
  }> {
    const totalCustomers = await this.customerRepository.count();
    
    const activeCustomers = await this.customerRepository.count({
      where: { isActive: true }
    });

    const vipCustomers = await this.customerRepository.count({
      where: { isVip: true }
    });

    // Calculate average order value and total revenue
    const customersWithOrders = await this.customerRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.orders', 'order')
      .select('customer.id')
      .addSelect('AVG(order.finalAmount)', 'avgOrderValue')
      .addSelect('SUM(order.finalAmount)', 'totalRevenue')
      .where('order.status IN (:...statuses)', { 
        statuses: ['DELIVERED', 'SHIPPED'] 
      })
      .groupBy('customer.id')
      .getRawMany();

    const avgOrderValue = customersWithOrders.length > 0 
      ? customersWithOrders.reduce((sum, c) => sum + parseFloat(c.avgOrderValue || 0), 0) / customersWithOrders.length
      : 0;

    const totalRevenue = customersWithOrders.reduce((sum, c) => sum + parseFloat(c.totalRevenue || 0), 0);

    return {
      totalCustomers,
      activeCustomers,
      vipCustomers,
      averageOrderValue: avgOrderValue,
      totalRevenue,
    };
  }
}
