import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

/**
 * Product Service
 * Handles all business logic related to product management
 * Includes CRUD operations, inventory management, and product validation
 */
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  /**
   * Create a new product
   * Validates SKU uniqueness and required fields
   */
  async create(createProductDto: {
    name: string;
    sku: string;
    price: number;
    stock: number;
    isActive?: boolean;
  }): Promise<Product> {
    // Check if SKU already exists
    const existingProduct = await this.productRepository.findOne({
      where: { sku: createProductDto.sku }
    });

    if (existingProduct) {
      throw new BadRequestException('Product with this SKU already exists');
    }

    // Validate price and stock
    if (createProductDto.price < 0) {
      throw new BadRequestException('Price cannot be negative');
    }

    if (createProductDto.stock < 0) {
      throw new BadRequestException('Stock cannot be negative');
    }

    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  /**
   * Get all products with optional filtering
   */
  async findAll(filters?: {
    isActive?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    lowStock?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const query = this.productRepository.createQueryBuilder('product');

    if (filters?.isActive !== undefined) {
      query.andWhere('product.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters?.search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters?.minPrice !== undefined) {
      query.andWhere('product.price >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters?.maxPrice !== undefined) {
      query.andWhere('product.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters?.lowStock) {
      query.andWhere('product.stock <= :lowStockThreshold', { lowStockThreshold: 10 });
    }

    const total = await query.getCount();

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    query.orderBy('product.createdAt', 'DESC');

    const products = await query.getMany();

    return { products, total };
  }

  /**
   * Get a single product by ID
   */
  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Get product by SKU
   */
  async findBySku(sku: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { sku } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Update product information
   */
  async update(id: number, updateProductDto: {
    name?: string;
    sku?: string;
    price?: number;
    stock?: number;
    isActive?: boolean;
  }): Promise<Product> {
    const product = await this.findOne(id);

    // Check if SKU is being changed and if it already exists
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: updateProductDto.sku }
      });

      if (existingProduct) {
        throw new BadRequestException('Product with this SKU already exists');
      }
    }

    // Validate price and stock
    if (updateProductDto.price !== undefined && updateProductDto.price < 0) {
      throw new BadRequestException('Price cannot be negative');
    }

    if (updateProductDto.stock !== undefined && updateProductDto.stock < 0) {
      throw new BadRequestException('Stock cannot be negative');
    }

    Object.assign(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  /**
   * Update product stock
   */
  async updateStock(id: number, quantity: number, operation: 'add' | 'subtract' = 'add'): Promise<Product> {
    const product = await this.findOne(id);

    if (operation === 'add') {
      product.stock += quantity;
    } else {
      if (product.stock < quantity) {
        throw new BadRequestException('Insufficient stock');
      }
      product.stock -= quantity;
    }

    return await this.productRepository.save(product);
  }

  /**
   * Reserve stock for an order
   */
  async reserveStock(id: number, quantity: number): Promise<Product> {
    const product = await this.findOne(id);

    if (!product.isActive) {
      throw new BadRequestException('Product is not active');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    product.stock -= quantity;
    return await this.productRepository.save(product);
  }

  /**
   * Release reserved stock
   */
  async releaseStock(id: number, quantity: number): Promise<Product> {
    const product = await this.findOne(id);
    product.stock += quantity;
    return await this.productRepository.save(product);
  }

  /**
   * Deactivate product
   */
  async deactivate(id: number): Promise<Product> {
    const product = await this.findOne(id);
    product.isActive = false;
    return await this.productRepository.save(product);
  }

  /**
   * Activate product
   */
  async activate(id: number): Promise<Product> {
    const product = await this.findOne(id);
    product.isActive = true;
    return await this.productRepository.save(product);
  }

  /**
   * Delete product
   */
  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  /**
   * Get product statistics
   */
  async getStatistics(): Promise<{
    totalProducts: number;
    activeProducts: number;
    totalValue: number;
    lowStockProducts: number;
    averagePrice: number;
  }> {
    const totalProducts = await this.productRepository.count();
    
    const activeProducts = await this.productRepository.count({
      where: { isActive: true }
    });

    const lowStockProducts = await this.productRepository.count({
      where: { stock: 10 } // Products with stock <= 10
    });

    const products = await this.productRepository.find({
      where: { isActive: true }
    });

    const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
    const averagePrice = products.length > 0 ? products.reduce((sum, product) => sum + product.price, 0) / products.length : 0;

    return {
      totalProducts,
      activeProducts,
      totalValue,
      lowStockProducts,
      averagePrice,
    };
  }
}
