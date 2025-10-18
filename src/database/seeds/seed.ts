import { DataSource } from 'typeorm';
import { User, UserRole } from '../../auth/user.entity';
import { Customer } from '../../customers/customer.entity';
import { Product } from '../../products/product.entity';
import { Order, OrderStatus } from '../../orders/order.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../../payments/payment.entity';
import * as bcrypt from 'bcryptjs';

/**
 * Database Seeder
 * Creates sample data for testing the ERP system
 */
export class DatabaseSeeder {
  constructor(private dataSource: DataSource) {}

  async seed(): Promise<void> {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await this.clearData();

    // Seed users
    const users = await this.seedUsers();
    console.log(`✅ Created ${users.length} users`);

    // Seed customers
    const customers = await this.seedCustomers(users);
    console.log(`✅ Created ${customers.length} customers`);

    // Seed products
    const products = await this.seedProducts();
    console.log(`✅ Created ${products.length} products`);

    // Seed orders
    const orders = await this.seedOrders(customers, products);
    console.log(`✅ Created ${orders.length} orders`);

    // Seed payments
    const payments = await this.seedPayments(orders, customers);
    console.log(`✅ Created ${payments.length} payments`);

    console.log('🎉 Database seeding completed successfully!');
  }

  private async clearData(): Promise<void> {
    console.log('🧹 Clearing existing data...');
    
    const entities = [Payment, Order, Product, Customer, User];
    
    for (const entity of entities) {
      await this.dataSource.getRepository(entity).clear();
    }
  }

  private async seedUsers(): Promise<User[]> {
    const users = [
      {
        email: 'admin@erp.com',
        name: 'Admin User',
        phone: '+1234567890',
        password: 'admin123',
        role: UserRole.ADMIN,
      },
      {
        email: 'john.doe@example.com',
        name: 'John Doe',
        phone: '+1234567891',
        password: 'customer123',
        role: UserRole.CUSTOMER,
      },
      {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        phone: '+1234567892',
        password: 'customer123',
        role: UserRole.CUSTOMER,
      },
      {
        email: 'bob.wilson@example.com',
        name: 'Bob Wilson',
        phone: '+1234567893',
        password: 'customer123',
        role: UserRole.CUSTOMER,
      },
    ];

    const userRepository = this.dataSource.getRepository(User);
    const createdUsers: User[] = [];

    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = userRepository.create({
        ...userData,
        password: hashedPassword,
      });
      createdUsers.push(await userRepository.save(user));
    }

    return createdUsers;
  }

  private async seedCustomers(users: User[]): Promise<Customer[]> {
    const customers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: users[1].email,
        phone: users[1].phone,
        company: 'Doe Enterprises',
        defaultShippingAddress: '123 Main St, New York, NY 10001',
        defaultBillingAddress: '123 Main St, New York, NY 10001',
        creditLimit: 10000,
        loyaltyPoints: 150,
        isActive: true,
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: users[2].email,
        phone: users[2].phone,
        company: 'Smith Corp',
        defaultShippingAddress: '456 Oak Ave, Los Angeles, CA 90210',
        defaultBillingAddress: '456 Oak Ave, Los Angeles, CA 90210',
        creditLimit: 15000,
        loyaltyPoints: 250,
        isActive: true,
      },
      {
        firstName: 'Bob',
        lastName: 'Wilson',
        email: users[3].email,
        phone: users[3].phone,
        company: 'Wilson Industries',
        defaultShippingAddress: '789 Pine Rd, Chicago, IL 60601',
        defaultBillingAddress: '789 Pine Rd, Chicago, IL 60601',
        creditLimit: 20000,
        loyaltyPoints: 100,
        isActive: true,
      },
    ];

    const customerRepository = this.dataSource.getRepository(Customer);
    const createdCustomers: Customer[] = [];

    for (const customerData of customers) {
      const customer = customerRepository.create(customerData);
      createdCustomers.push(await customerRepository.save(customer));
    }

    return createdCustomers;
  }

  private async seedProducts(): Promise<Product[]> {
    const products = [
      {
        name: 'Laptop Pro 15"',
        sku: 'LAPTOP-PRO-15',
        price: 1299.99,
        stock: 50,
        isActive: true,
      },
      {
        name: 'Wireless Mouse',
        sku: 'MOUSE-WIRELESS-001',
        price: 29.99,
        stock: 200,
        isActive: true,
      },
      {
        name: 'Mechanical Keyboard',
        sku: 'KEYBOARD-MECH-001',
        price: 149.99,
        stock: 75,
        isActive: true,
      },
      {
        name: 'Monitor 27" 4K',
        sku: 'MONITOR-27-4K',
        price: 399.99,
        stock: 30,
        isActive: true,
      },
      {
        name: 'Office Chair',
        sku: 'CHAIR-OFFICE-001',
        price: 199.99,
        stock: 25,
        isActive: true,
      },
    ];

    const productRepository = this.dataSource.getRepository(Product);
    const createdProducts: Product[] = [];

    for (const productData of products) {
      const product = productRepository.create(productData);
      createdProducts.push(await productRepository.save(product));
    }

    return createdProducts;
  }

  private async seedOrders(customers: Customer[], products: Product[]): Promise<Order[]> {
    // Get users to map customer emails to user IDs
    const userRepository = this.dataSource.getRepository(User);
    const users = await userRepository.find();
    
    const orders = [
      {
        customerId: users.find(u => u.email === customers[0].email)?.id || 2,
        orderNumber: 'ORD-20241201-000001',
        status: OrderStatus.CONFIRMED,
        items: [
          {
            productId: products[0].id,
            productName: products[0].name,
            quantity: 1,
            unitPrice: products[0].price,
            totalPrice: products[0].price,
          },
          {
            productId: products[1].id,
            productName: products[1].name,
            quantity: 2,
            unitPrice: products[1].price,
            totalPrice: products[1].price * 2,
          },
        ],
        totalAmount: products[0].price + (products[1].price * 2),
        taxAmount: 0,
        shippingCost: 15.00,
        discountAmount: 50.00,
        finalAmount: products[0].price + (products[1].price * 2) + 15.00 - 50.00,
        shippingAddress: '123 Main St, New York, NY 10001',
        billingAddress: '123 Main St, New York, NY 10001',
        notes: 'Please deliver during business hours',
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        customerId: users.find(u => u.email === customers[1].email)?.id || 3,
        orderNumber: 'ORD-20241201-000002',
        status: OrderStatus.PENDING,
        items: [
          {
            productId: products[2].id,
            productName: products[2].name,
            quantity: 1,
            unitPrice: products[2].price,
            totalPrice: products[2].price,
          },
          {
            productId: products[3].id,
            productName: products[3].name,
            quantity: 1,
            unitPrice: products[3].price,
            totalPrice: products[3].price,
          },
        ],
        totalAmount: products[2].price + products[3].price,
        taxAmount: 0,
        shippingCost: 20.00,
        discountAmount: 0,
        finalAmount: products[2].price + products[3].price + 20.00,
        shippingAddress: '456 Oak Ave, Los Angeles, CA 90210',
        billingAddress: '456 Oak Ave, Los Angeles, CA 90210',
        notes: 'Gift wrapping requested',
        expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      },
      {
        customerId: users.find(u => u.email === customers[2].email)?.id || 4,
        orderNumber: 'ORD-20241201-000003',
        status: OrderStatus.DELIVERED,
        items: [
          {
            productId: products[4].id,
            productName: products[4].name,
            quantity: 2,
            unitPrice: products[4].price,
            totalPrice: products[4].price * 2,
          },
        ],
        totalAmount: products[4].price * 2,
        taxAmount: 0,
        shippingCost: 25.00,
        discountAmount: 0,
        finalAmount: (products[4].price * 2) + 25.00,
        shippingAddress: '789 Pine Rd, Chicago, IL 60601',
        billingAddress: '789 Pine Rd, Chicago, IL 60601',
        notes: 'Bulk order for office setup',
        expectedDeliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        deliveredDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    ];

    const orderRepository = this.dataSource.getRepository(Order);
    const createdOrders: Order[] = [];

    for (const orderData of orders) {
      const order = orderRepository.create(orderData as any);
      const savedOrder = await orderRepository.save(order) as unknown as Order;
      createdOrders.push(savedOrder);
    }

    return createdOrders;
  }

  private async seedPayments(orders: Order[], customers: Customer[]): Promise<Payment[]> {
    // Get users to map customer emails to user IDs
    const userRepository = this.dataSource.getRepository(User);
    const users = await userRepository.find();
    
    const payments = [
      {
        orderId: orders[0].id,
        customerId: users.find(u => u.email === customers[0].email)?.id || 1,
        amount: orders[0].finalAmount,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        status: PaymentStatus.COMPLETED,
        gatewayTransactionId: 'pi_test_stripe_001',
        processedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        orderId: orders[1].id,
        customerId: users.find(u => u.email === customers[1].email)?.id || 2,
        amount: orders[1].finalAmount,
        currency: 'USD',
        paymentMethod: PaymentMethod.PAYPAL,
        status: PaymentStatus.PENDING,
        gatewayTransactionId: 'paypal_test_001',
      },
      {
        orderId: orders[2].id,
        customerId: users.find(u => u.email === customers[2].email)?.id || 3,
        amount: orders[2].finalAmount,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE,
        status: PaymentStatus.COMPLETED,
        gatewayTransactionId: 'pi_test_stripe_002',
        processedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    ];

    const paymentRepository = this.dataSource.getRepository(Payment);
    const createdPayments: Payment[] = [];

    for (const paymentData of payments) {
      const payment = paymentRepository.create(paymentData as any);
      const savedPayment = await paymentRepository.save(payment) as unknown as Payment;
      createdPayments.push(savedPayment);
    }

    return createdPayments;
  }
}
