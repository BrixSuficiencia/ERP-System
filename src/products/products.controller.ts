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
  UseGuards
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/user.entity';

/**
 * Product Controller
 * Handles HTTP requests related to product management
 * Includes authentication and role-based access control
 */
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Get all products with optional filtering
   * GET /products?isActive=true&search=laptop&minPrice=100&maxPrice=1000&lowStock=true
   */
  @Get()
  async findAll(
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('lowStock') lowStock?: boolean,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    const filters: any = {};
    
    if (isActive !== undefined) filters.isActive = isActive;
    if (search) filters.search = search;
    if (minPrice !== undefined) filters.minPrice = minPrice;
    if (maxPrice !== undefined) filters.maxPrice = maxPrice;
    if (lowStock !== undefined) filters.lowStock = lowStock;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;

    return await this.productsService.findAll(filters);
  }

  /**
   * Get a single product by ID
   * GET /products/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.productsService.findOne(id);
  }

  /**
   * Get product by SKU
   * GET /products/sku/:sku
   */
  @Get('sku/:sku')
  async findBySku(@Param('sku') sku: string) {
    return await this.productsService.findBySku(sku);
  }

  /**
   * Create a new product
   * POST /products
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createProductDto: {
    name: string;
    sku: string;
    price: number;
    stock: number;
    isActive?: boolean;
  }) {
    return await this.productsService.create(createProductDto);
  }

  /**
   * Update product information
   * PUT /products/:id
   */
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: {
      name?: string;
      sku?: string;
      price?: number;
      stock?: number;
      isActive?: boolean;
    }
  ) {
    return await this.productsService.update(id, updateProductDto);
  }

  /**
   * Update product stock
   * PUT /products/:id/stock
   */
  @Put(':id/stock')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStockDto: { quantity: number; operation: 'add' | 'subtract' }
  ) {
    return await this.productsService.updateStock(id, updateStockDto.quantity, updateStockDto.operation);
  }

  /**
   * Reserve stock for an order
   * POST /products/:id/reserve
   */
  @Post(':id/reserve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async reserveStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() reserveStockDto: { quantity: number }
  ) {
    return await this.productsService.reserveStock(id, reserveStockDto.quantity);
  }

  /**
   * Release reserved stock
   * POST /products/:id/release
   */
  @Post(':id/release')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async releaseStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() releaseStockDto: { quantity: number }
  ) {
    return await this.productsService.releaseStock(id, releaseStockDto.quantity);
  }

  /**
   * Deactivate product
   * PUT /products/:id/deactivate
   */
  @Put(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    return await this.productsService.deactivate(id);
  }

  /**
   * Activate product
   * PUT /products/:id/activate
   */
  @Put(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async activate(@Param('id', ParseIntPipe) id: number) {
    return await this.productsService.activate(id);
  }

  /**
   * Delete product
   * DELETE /products/:id
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.productsService.remove(id);
    return { message: 'Product deleted successfully' };
  }

  /**
   * Get product statistics
   * GET /products/statistics
   */
  @Get('statistics/overview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStatistics() {
    return await this.productsService.getStatistics();
  }
}
