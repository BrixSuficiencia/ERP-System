import { IsString, IsEmail, IsOptional, IsDateString, IsBoolean, IsNumber, Min } from 'class-validator';

/**
 * DTO for creating a new customer
 * Validates all required fields and data types
 */
export class CreateCustomerDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  defaultShippingAddress?: string;

  @IsOptional()
  @IsString()
  defaultBillingAddress?: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @IsOptional()
  @IsString()
  preferredCurrency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isVip?: boolean;

  @IsOptional()
  @IsString()
  preferredPaymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
