import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity';

/**
 * Customer Service
 * Handles all business logic related to customer management
 * Includes CRUD operations and customer-specific business logic
 */
@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(User)
    private customerRepository: Repository<User>,
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
    preferredPaymentMethod?: string;
    notes?: string;
  }): Promise<User> {
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
    company?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ customers: User[]; total: number }> {
    const query = this.customerRepository.createQueryBuilder('Customer');

    // ✅ Only include users with the "customer" role
    query.where('customer.role = :role', { role: 'CUSTOMER' });

    if (filters?.isActive !== undefined) {
      query.andWhere('customer.isActive = :isActive', { isActive: filters.isActive });
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
  async findOne(id: number): Promise<User> {
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
  async findByEmail(email: string): Promise<User> {
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
    preferredPaymentMethod?: string;
    notes?: string;
  }): Promise<User> {
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
   * Deactivate customer
   */
  async deactivate(id: number): Promise<User> {
    const customer = await this.findOne(id);
    customer.isActive = false;
    return await this.customerRepository.save(customer);
  }

  /**
   * Activate customer
   */
  async activate(id: number): Promise<User> {
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
    averageOrderValue: number;
    totalRevenue: number;
  }> {
    const totalCustomers = await this.customerRepository.count();
    
    const activeCustomers = await this.customerRepository.count({
      where: { isActive: true }
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
      averageOrderValue: avgOrderValue,
      totalRevenue,
    };
  }
}
