import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete, 
  Query, 
  ParseIntPipe,
  UseGuards,
  Request
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatus } from './order.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/user.entity';

/**
 * Order Controller
 * Handles HTTP requests related to order management
 * Includes authentication and role-based access control
 */
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Create a new order
   * POST /orders
   */
  @Post()
  async create(@Body() createOrderDto: {
    customerId: number;
    items: Array<{ productId: number; quantity: number }>;
    shippingAddress: string;
    billingAddress: string;
    notes?: string;
  }) {
    return await this.ordersService.create(createOrderDto);
  }

  /**
   * Get all orders with optional filtering
   * GET /orders?status=PENDING&customerId=1&limit=10&offset=0
   */
  @Get()
  async findAll(
    @Query('status') status?: OrderStatus,
    @Query('customerId') customerId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Request() req?: any
  ) {
    // If user is a customer, only show their orders
    const filters: any = {};
    
    if (status) filters.status = status;
    if (customerId) filters.customerId = customerId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;

    // If user is a customer, filter by their ID
    if (req.user.role === UserRole.CUSTOMER) {
      filters.customerId = req.user.id;
    }

    return await this.ordersService.findAll(filters);
  }

  /**
   * Get a single order by ID
   * GET /orders/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const order = await this.ordersService.findOne(id);
    
    // If user is a customer, only allow access to their own orders
    if (req.user.role === UserRole.CUSTOMER && order.customerId !== req.user.id) {
      throw new Error('Access denied');
    }
    
    return order;
  }

  /**
   * Update order status
   * PUT /orders/:id/status
   */
  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: { status: OrderStatus }
  ) {
    return await this.ordersService.updateStatus(id, updateStatusDto.status);
  }

  /**
   * Update order details
   * PUT /orders/:id
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: {
      shippingAddress?: string;
      billingAddress?: string;
      notes?: string;
      expectedDeliveryDate?: string;
    },
    @Request() req: any
  ) {
    const order = await this.ordersService.findOne(id);
    
    // If user is a customer, only allow updates to their own orders
    if (req.user.role === UserRole.CUSTOMER && order.customerId !== req.user.id) {
      throw new Error('Access denied');
    }

    // Convert date string to Date object if provided
    const processedDto: any = { ...updateOrderDto };
    if (processedDto.expectedDeliveryDate) {
      processedDto.expectedDeliveryDate = new Date(processedDto.expectedDeliveryDate);
    }

    return await this.ordersService.update(id, processedDto);
  }

  /**
   * Cancel an order
   * PUT /orders/:id/cancel
   */
  @Put(':id/cancel')
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() cancelOrderDto: { reason?: string },
    @Request() req: any
  ) {
    const order = await this.ordersService.findOne(id);
    
    // If user is a customer, only allow cancellation of their own orders
    if (req.user.role === UserRole.CUSTOMER && order.customerId !== req.user.id) {
      throw new Error('Access denied');
    }

    return await this.ordersService.cancel(id, cancelOrderDto.reason);
  }

  /**
   * Delete an order
   * DELETE /orders/:id
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.ordersService.remove(id);
    return { message: 'Order deleted successfully' };
  }

  /**
   * Get order statistics
   * GET /orders/statistics
   */
  @Get('statistics/overview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStatistics() {
    return await this.ordersService.getStatistics();
  }
}
