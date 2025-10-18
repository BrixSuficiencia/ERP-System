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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from '../common/dto/create-customer.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/user.entity';

/**
 * Customer Controller
 * Handles HTTP requests related to customer management
 * Includes authentication and role-based access control
 */
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  /**
   * Create a new customer
   * POST /customers
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    // Convert date string to Date object if provided
    if (createCustomerDto.dateOfBirth) {
      createCustomerDto.dateOfBirth = new Date(createCustomerDto.dateOfBirth);
    }

    return await this.customersService.create(createCustomerDto);
  }

  /**
   * Get all customers with optional filtering
   * GET /customers?isActive=true&isVip=false&search=john&limit=10&offset=0
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('isActive') isActive?: boolean,
    @Query('isVip') isVip?: boolean,
    @Query('company') company?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    const filters: any = {};
    
    if (isActive !== undefined) filters.isActive = isActive;
    if (isVip !== undefined) filters.isVip = isVip;
    if (company) filters.company = company;
    if (search) filters.search = search;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;

    return await this.customersService.findAll(filters);
  }

  /**
   * Get a single customer by ID
   * GET /customers/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const customer = await this.customersService.findOne(id);
    
    // If user is a customer, only allow access to their own profile
    if (req.user.role === UserRole.CUSTOMER && customer.id !== req.user.id) {
      throw new Error('Access denied');
    }
    
    return customer;
  }

  /**
   * Get customer by email
   * GET /customers/email/:email
   */
  @Get('email/:email')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findByEmail(@Param('email') email: string) {
    return await this.customersService.findByEmail(email);
  }

  /**
   * Update customer information
   * PUT /customers/:id
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      dateOfBirth?: string;
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
    },
    @Request() req: any
  ) {
    // If user is a customer, only allow updates to their own profile
    if (req.user.role === UserRole.CUSTOMER && id !== req.user.id) {
      throw new Error('Access denied');
    }

    // Convert date string to Date object if provided
    if (updateCustomerDto.dateOfBirth) {
      updateCustomerDto.dateOfBirth = new Date(updateCustomerDto.dateOfBirth);
    }

    return await this.customersService.update(id, updateCustomerDto);
  }

  /**
   * Update customer balance
   * PUT /customers/:id/balance
   */
  @Put(':id/balance')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateBalance(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBalanceDto: { amount: number }
  ) {
    return await this.customersService.updateBalance(id, updateBalanceDto.amount);
  }

  /**
   * Add loyalty points
   * POST /customers/:id/loyalty-points
   */
  @Post(':id/loyalty-points')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async addLoyaltyPoints(
    @Param('id', ParseIntPipe) id: number,
    @Body() loyaltyPointsDto: { points: number }
  ) {
    return await this.customersService.addLoyaltyPoints(id, loyaltyPointsDto.points);
  }

  /**
   * Deactivate customer
   * PUT /customers/:id/deactivate
   */
  @Put(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    return await this.customersService.deactivate(id);
  }

  /**
   * Activate customer
   * PUT /customers/:id/activate
   */
  @Put(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async activate(@Param('id', ParseIntPipe) id: number) {
    return await this.customersService.activate(id);
  }

  /**
   * Delete customer (soft delete)
   * DELETE /customers/:id
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.customersService.remove(id);
    return { message: 'Customer deactivated successfully' };
  }

  /**
   * Get customer statistics
   * GET /customers/statistics
   */
  @Get('statistics/overview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStatistics() {
    return await this.customersService.getStatistics();
  }
}
