import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from './customer.entity';

/**
 * Customer Module
 * Manages customer-related functionality
 * Includes customer CRUD operations and business logic
 */
@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService], // Export service for use in other modules
})
export class CustomersModule {}
