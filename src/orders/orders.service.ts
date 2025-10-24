import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { Product } from '../products/product.entity';
import { User, UserRole } from '../auth/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Order Service
 * Handles all business logic related to orders
 * Includes CRUD operations, status management, and order processing
 */
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Create a new order
   * Validates products, calculates totals, and creates order
   */
  async create(createOrderDto: {
    customerId: number;
    items: Array<{ productId: number; quantity: number }>;
    shippingAddress: string;
    billingAddress: string;
    notes?: string;
  }): Promise<Order> {
    const { customerId, items, shippingAddress, billingAddress, notes } = createOrderDto;

    // Validate customer exists
    const customer = await this.userRepository.findOne({ where: { id: customerId, role: UserRole.CUSTOMER } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Validate and process items
    const processedItems: Array<{
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = await this.processOrderItems(items);
    
    // Calculate totals
    const totals = this.calculateOrderTotals(processedItems);
    
    // Generate unique order number
    const orderNumber = await this.generateOrderNumber();

    // Create order
    const order = this.orderRepository.create({
      orderNumber,
      customerId,
      customer,
      status: OrderStatus.PENDING,
      items: processedItems,
      totalAmount: totals.subtotal,
      taxAmount: totals.tax,
      shippingCost: totals.shipping,
      discountAmount: totals.discount,
      finalAmount: totals.total,
      shippingAddress,
      billingAddress,
      notes,
    });

    const savedOrder = await this.orderRepository.save(order);

    // After order is successfully created
    for (const item of processedItems) {
      await this.productRepository.decrement({ id: item.productId }, 'stock', item.quantity);
    }

    // Send notification to admins about new order
    await this.notificationsService.notifyNewOrder(
      savedOrder.id,
      savedOrder.customerId,
      {
        orderNumber: savedOrder.orderNumber,
        totalAmount: savedOrder.finalAmount,
        items: savedOrder.items,
        customerName: customer.name,
      }
    );

    return savedOrder;
  }

  /**
   * Get all orders with optional filtering
   */
  async findAll(filters?: {
    status?: OrderStatus;
    customerId?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number }> {
    const query = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.payments', 'payments');

    if (filters?.status) {
      query.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters?.customerId) {
      query.andWhere('order.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters?.startDate) {
      query.andWhere('order.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('order.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const total = await query.getCount();

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    query.orderBy('order.createdAt', 'DESC');

    const orders = await query.getMany();

    return { orders, total };
  }

  /**
   * Get a single order by ID
   */
  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['customer', 'payments'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * Update order status
   */
  async updateStatus(id: number, status: OrderStatus, userId?: number): Promise<Order> {
    const order = await this.findOne(id);

    // Validate status transition
    if (!this.isValidStatusTransition(order.status, status)) {
      throw new BadRequestException(`Invalid status transition from ${order.status} to ${status}`);
    }

    // Update status
    order.status = status;

    // Set delivery date if status is DELIVERED
    if (status === OrderStatus.DELIVERED) {
      order.deliveredDate = new Date();
    }

    const savedOrder = await this.orderRepository.save(order);

    // Send notification to customer about status update
    await this.notificationsService.notifyOrderStatusUpdate(
      order.customerId,
      order.id,
      status,
      {
        orderNumber: order.orderNumber,
        status,
        totalAmount: order.finalAmount,
        items: order.items,
      }
    );

    return savedOrder;
  }

  /**
   * Update order details
   */
  async update(id: number, updateOrderDto: {
    shippingAddress?: string;
    billingAddress?: string;
    notes?: string;
    expectedDeliveryDate?: Date;
  }): Promise<Order> {
    const order = await this.findOne(id);

    // Only allow updates for pending orders
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Cannot update order that is not in PENDING status');
    }

    Object.assign(order, updateOrderDto);
    return await this.orderRepository.save(order);
  }

  /**
   * Cancel an order
   */
  async cancel(id: number, reason?: string): Promise<Order> {
    const order = await this.findOne(id);

    // Only allow cancellation of pending or confirmed orders
    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new BadRequestException('Cannot cancel order in current status');
    }

    order.status = OrderStatus.CANCELLED;
    if (reason) {
      order.cancellationReason = reason;
      order.notes = order.notes ? `${order.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
    }

    return await this.orderRepository.save(order);
  }

  /**
   * Delete an order (soft delete by setting status to cancelled)
   */
  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    
    // Only allow deletion of pending orders
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Cannot delete order that is not in PENDING status');
    }

    await this.orderRepository.remove(order);
  }

  /**
   * Get order statistics
   */
  async getStatistics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<OrderStatus, number>;
  }> {
    const totalOrders = await this.orderRepository.count();
    const totalRevenue = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.finalAmount)', 'total')
      .where('order.status IN (:...statuses)', { 
        statuses: [OrderStatus.DELIVERED, OrderStatus.SHIPPED] 
      })
      .getRawOne();

    const averageOrderValue = totalOrders > 0 ? totalRevenue.total / totalOrders : 0;

    const ordersByStatus = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    const statusCounts = ordersByStatus.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {} as Record<OrderStatus, number>);

    return {
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.total) || 0,
      averageOrderValue,
      ordersByStatus: statusCounts,
    };
  }

  /**
   * Process and validate order items
   */
  private async processOrderItems(items: Array<{ productId: number; quantity: number }>): Promise<Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>> {
    const processedItems: Array<{
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    for (const item of items) {
      const product = await this.productRepository.findOne({ where: { id: item.productId } });
      
      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }

      if (!product.isActive) {
        throw new BadRequestException(`Product ${product.name} is not available`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }

      processedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: product.price * item.quantity,
      });
    }

    return processedItems;
  }

  /**
   * Calculate order totals including tax, shipping, and discounts
   */
  private calculateOrderTotals(items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>) {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxRate = 0.1; // 10% tax rate - should be configurable
    const tax = subtotal * taxRate;
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const discount = 0; // Could implement discount logic here
    const total = subtotal + tax + shipping - discount;

    return { subtotal, tax, shipping, discount, total };
  }

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `ORD-${dateStr}-${randomNum}`;
  }

  /**
   * Validate status transition
   */
  private isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}
