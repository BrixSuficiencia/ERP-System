import { 
  Controller, 
  Get, 
  Query, 
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/user.entity';

/**
 * Dashboard Controller
 * Provides comprehensive business analytics and dashboard endpoints
 * Includes sales analytics, customer insights, and business metrics
 */
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get comprehensive dashboard overview
   * GET /dashboard/overview
   */
  @Get('overview')
  async getOverview() {
    return await this.dashboardService.getDashboardOverview();
  }

  /**
   * Get sales by product analytics
   * GET /dashboard/sales-by-product?startDate=2024-01-01&endDate=2024-12-31
   */
  @Get('sales-by-product')
  async getSalesAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return await this.dashboardService.getSalesAnalytics();

  }

  /**
   * Get top customers analytics
   * GET /dashboard/top-customers?limit=10
   */
  @Get('top-customers')
  async getTopCustomers(@Query('limit', ParseIntPipe) limit: number = 10) {
    return await this.dashboardService.getTopCustomers(limit);
  }

  /**
   * Get payment failure analytics
   * GET /dashboard/payment-failures
   */
  @Get('payment-failures')
  async getPaymentFailures() {
    return await this.dashboardService.getPaymentFailureAnalytics();
  }
}
