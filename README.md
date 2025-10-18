# ERP Backend System

A comprehensive Enterprise Resource Planning (ERP) backend system built with NestJS, TypeScript, and PostgreSQL. This system manages Products, Customers, Orders, and Payments with proper authentication, data integrity, and integration of third-party payment gateways.

## 🚀 Features

### Core Modules
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Product Management**: CRUD operations, inventory tracking, stock management
- **Customer Management**: Customer profiles, loyalty points, credit management
- **Order Management**: Order processing, status tracking, order lifecycle management
- **Payment Processing**: Multiple payment gateways (Stripe, PayPal, Maya), refund handling

### Technical Features
- **Database**: PostgreSQL with TypeORM for data persistence
- **Authentication**: JWT tokens with role-based access control
- **Validation**: Comprehensive input validation with class-validator
- **Error Handling**: Structured error responses and logging
- **API Documentation**: RESTful API with comprehensive endpoints
- **Security**: Password hashing, CORS configuration, input sanitization
- **Real-time**: Socket.IO WebSocket connections for live notifications
- **Analytics**: Comprehensive business intelligence and reporting
- **Dashboard**: Real-time business metrics and insights

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd erp-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_NAME=erp_backend

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=24h

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # Payment Gateway Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   PAYPAL_CLIENT_ID=your_paypal_client_id_here
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
   MAYA_PUBLIC_KEY=your_maya_public_key_here
   MAYA_SECRET_KEY=your_maya_secret_key_here
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb erp_backend
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile (including phone)
- `PUT /api/v1/auth/change-password` - Change password
- `GET /api/v1/auth/validate` - Validate JWT token

### Products
- `GET /api/v1/products` - Get all products (with filtering)
- `GET /api/v1/products/:id` - Get product by ID
- `GET /api/v1/products/sku/:sku` - Get product by SKU
- `POST /api/v1/products` - Create product (Admin only)
- `PUT /api/v1/products/:id` - Update product (Admin only)
- `PUT /api/v1/products/:id/stock` - Update stock (Admin only)
- `POST /api/v1/products/:id/reserve` - Reserve stock (Admin only)
- `POST /api/v1/products/:id/release` - Release stock (Admin only)
- `DELETE /api/v1/products/:id` - Delete product (Admin only)

### Customers
- `GET /api/v1/customers` - Get all customers (Admin only)
- `GET /api/v1/customers/:id` - Get customer by ID
- `GET /api/v1/customers/email/:email` - Get customer by email (Admin only)
- `POST /api/v1/customers` - Create customer (Admin only)
- `PUT /api/v1/customers/:id` - Update customer
- `PUT /api/v1/customers/:id/balance` - Update balance (Admin only)
- `POST /api/v1/customers/:id/loyalty-points` - Add loyalty points (Admin only)
- `DELETE /api/v1/customers/:id` - Delete customer (Admin only)

### Orders
- `GET /api/v1/orders` - Get all orders (with filtering)
- `GET /api/v1/orders/:id` - Get order by ID
- `POST /api/v1/orders` - Create order
- `PUT /api/v1/orders/:id` - Update order
- `PUT /api/v1/orders/:id/status` - Update order status (Admin only)
- `PUT /api/v1/orders/:id/cancel` - Cancel order
- `DELETE /api/v1/orders/:id` - Delete order (Admin only)

### Payments
- `GET /api/v1/payments` - Get all payments (with filtering)
- `GET /api/v1/payments/:id` - Get payment by ID
- `POST /api/v1/payments` - Create payment
- `POST /api/v1/payments/:id/refund` - Refund payment (Admin only)
- `GET /api/v1/payments/methods/available` - Get available payment methods
- `GET /api/v1/payments/statuses/available` - Get payment statuses

### Dashboard & Analytics
- `GET /api/v1/dashboard/overview` - Comprehensive dashboard overview (Admin only)
- `GET /api/v1/dashboard/sales-by-product` - Sales analytics by product (Admin only)
- `GET /api/v1/dashboard/top-customers` - Top customers analytics (Admin only)
- `GET /api/v1/dashboard/payment-failures` - Payment failure analytics (Admin only)

### Real-time Notifications
- `GET /api/v1/notifications/stats` - Get notification statistics
- `POST /api/v1/notifications/send` - Send notification to user (Admin only)
- `POST /api/v1/notifications/broadcast` - Broadcast announcement (Admin only)
- `POST /api/v1/notifications/test` - Test notification (Admin only)
- **WebSocket**: `ws://localhost:3000/notifications` - Real-time notifications

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles
- **ADMIN**: Full access to all endpoints
- **CUSTOMER**: Limited access to own data

## 💳 Payment Gateways

The system supports multiple payment gateways:

### Stripe
- Credit/Debit cards
- Digital wallets
- International payments

### PayPal
- PayPal accounts
- Credit cards via PayPal
- International payments

### Maya (Philippines)
- Local payment methods
- Bank transfers
- E-wallets

## 🗄️ Database Schema

### Core Entities
- **Users**: Authentication and user management
- **Customers**: Customer information and preferences
- **Products**: Product catalog and inventory
- **Orders**: Order management and tracking
- **Payments**: Payment processing and history

### Relationships
- Users can have multiple Orders
- Orders belong to one Customer
- Orders can have multiple Payments
- Products are referenced in Order items

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📊 Monitoring & Logging

The application includes:
- Request/response logging
- Error tracking
- Performance monitoring
- Database query logging

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure payment gateway production keys
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies

### Docker Deployment
```bash
# Build Docker image
docker build -t erp-backend .

# Run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0**: Initial release with core ERP functionality
- **v1.1.0**: Added payment gateway integration
- **v1.2.0**: Enhanced security and validation
- **v1.3.0**: Added comprehensive documentation and testing
