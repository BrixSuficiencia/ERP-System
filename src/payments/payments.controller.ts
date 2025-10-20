import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  ParseIntPipe,
  UseGuards,
  Request
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentStatus, PaymentMethod } from './payment.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/user.entity';

/**
 * Payment Controller
 * Handles HTTP requests related to payment processing
 * Includes authentication and role-based access control
 */
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Create a new payment
   * POST /payments
   */
  @Post()
  async create(@Body() createPaymentDto: {
    orderId: number;
    customerId: number;
    amount: number;
    paymentMethod: PaymentMethod;
    currency?: string;
    metadata?: any;
  }) {
    return await this.paymentsService.create(createPaymentDto);
  }

  /**
   * Get all payments with optional filtering
   * GET /payments?orderId=1&customerId=1&status=COMPLETED&paymentMethod=STRIPE
   */
  @Get()
  async findAll(
    @Query('orderId') orderId?: number,
    @Query('customerId') customerId?: number,
    @Query('status') status?: PaymentStatus,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Request() req?: any
  ) {
    // If user is a customer, only show their payments
    const filters: any = {};
    
    if (orderId) filters.orderId = orderId;
    if (customerId) filters.customerId = customerId;
    if (status) filters.status = status;
    if (paymentMethod) filters.paymentMethod = paymentMethod;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;

    // If user is a customer, filter by their ID
    if (req.user.role === UserRole.CUSTOMER) {
      filters.customerId = req.user.id;
    }

    return await this.paymentsService.findAll(filters);
  }

  /**
   * Get a single payment by ID
   * GET /payments/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const payment = await this.paymentsService.findOne(id);
    
    // If user is a customer, only allow access to their own payments
    if (req.user.role === UserRole.CUSTOMER && payment.customerId !== req.user.id) {
      throw new Error('Access denied');
    }
    
    return payment;
  }

  /**
   * Refund a payment
   * POST /payments/:id/refund
   */
  @Post(':id/refund')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async refund(
    @Param('id', ParseIntPipe) id: number,
    @Body() refundDto: { amount?: number; reason?: string }
  ) {
    return await this.paymentsService.refund(id, refundDto.amount, refundDto.reason);
  }

  /**
   * Get payment statistics
   * GET /payments/statistics
   */
  @Get('statistics/overview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStatistics() {
    return await this.paymentsService.getStatistics();
  }

  /**
   * Get payment methods
   * GET /payments/methods
   */
  @Get('methods/available')
  async getPaymentMethods() {
    return {
      methods: Object.values(PaymentMethod),
      supportedCurrencies: ['USD', 'EUR', 'PHP', 'GBP', 'CAD'],
      defaultCurrency: 'USD'
    };
  }

  /**
   * Get payment statuses
   * GET /payments/statuses
   */
  @Get('statuses/available')
  async getPaymentStatuses() {
    return {
      statuses: Object.values(PaymentStatus),
      descriptions: {
        [PaymentStatus.PENDING]: 'Payment initiated but not yet processed',
        [PaymentStatus.PROCESSING]: 'Payment is being processed by gateway',
        [PaymentStatus.COMPLETED]: 'Payment successfully completed',
        [PaymentStatus.FAILED]: 'Payment failed',
        [PaymentStatus.CANCELLED]: 'Payment was cancelled',
        [PaymentStatus.REFUNDED]: 'Payment has been refunded',
        [PaymentStatus.PARTIALLY_REFUNDED]: 'Payment partially refunded'
      }
    };
  }
}
