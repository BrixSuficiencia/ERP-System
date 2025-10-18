# ERP Backend - Database Setup Guide

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js (v18 or higher)
- npm or yarn

### 1. Start Database Services

```bash
# Start PostgreSQL and Redis using Docker Compose
npm run db:setup

# Or manually:
docker-compose up -d postgres redis
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and update with your values:

```bash
# Copy the example file
cp env.example .env
```

**Important**: Update the `.env` file with your actual Stripe test keys:
- Get Stripe test keys from: https://dashboard.stripe.com/test/apikeys
- Replace `sk_test_your_stripe_secret_key_here` with your actual test secret key
- Replace `pk_test_your_stripe_publishable_key_here` with your actual test publishable key

### 4. Seed the Database

```bash
# Run the database seeder to create test data
npm run seed
```

This will create:
- 4 users (1 admin, 3 customers)
- 3 customer profiles
- 5 products
- 3 orders with different statuses
- 3 payments with different statuses

### 5. Start the Application

```bash
# Start in development mode
npm run start:dev
```

The API will be available at: `http://localhost:3000`

## 📊 Test Data Created

### Users
- **Admin**: `admin@erp.com` / `admin123`
- **Customer 1**: `john.doe@example.com` / `customer123`
- **Customer 2**: `jane.smith@example.com` / `customer123`
- **Customer 3**: `bob.wilson@example.com` / `customer123`

### Products
- Laptop Pro 15" - $1,299.99
- Wireless Mouse - $29.99
- Mechanical Keyboard - $149.99
- Monitor 27" 4K - $399.99
- Office Chair - $199.99

### Orders
- Order 1: Confirmed status with completed Stripe payment
- Order 2: Pending status with pending PayPal payment
- Order 3: Delivered status with completed Stripe payment

## 🔧 Database Management Commands

```bash
# Start database services
npm run db:setup

# Stop database services
npm run db:down

# Reset database (removes all data)
npm run db:reset

# Seed database with test data
npm run seed
```

## 🧪 Testing the API

### 1. Authentication
```bash
# Login as admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@erp.com", "password": "admin123"}'

# Login as customer
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@example.com", "password": "customer123"}'
```

### 2. Get Products
```bash
curl -X GET http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get Orders
```bash
curl -X GET http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Get Payments
```bash
curl -X GET http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 💳 Payment Testing

### Stripe Test Cards
Use these test card numbers for Stripe payments:

- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`
- **Insufficient Funds**: `4000000000009995`
- **Expired Card**: `4000000000000069`

### Test Payment Flow
1. Create an order
2. Create a payment with `paymentMethod: "STRIPE"`
3. The payment will be automatically processed (simulated)
4. Check payment status via API

## 🔍 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration

### Products
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/:id` - Get product by ID
- `POST /api/v1/products` - Create product (Admin only)

### Orders
- `GET /api/v1/orders` - List orders
- `GET /api/v1/orders/:id` - Get order by ID
- `POST /api/v1/orders` - Create order

### Payments
- `GET /api/v1/payments` - List payments
- `GET /api/v1/payments/:id` - Get payment by ID
- `POST /api/v1/payments` - Create payment
- `POST /api/v1/payments/:id/refund` - Refund payment (Admin only)

### Dashboard
- `GET /api/v1/dashboard/overview` - Dashboard overview (Admin only)

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps

# Check PostgreSQL logs
docker logs erp-postgres

# Reset database if needed
npm run db:reset
```

### Port Conflicts
If ports 5432 or 6379 are already in use:
1. Stop the conflicting services
2. Or modify the ports in `docker-compose.yml`

### Environment Variables
Make sure your `.env` file is properly configured:
- Database credentials match Docker Compose settings
- Stripe keys are valid test keys
- JWT secret is set

## 📝 Next Steps

1. **Set up Stripe Webhooks** (see webhook setup guide)
2. **Test payment flows** with real Stripe test cards
3. **Configure PayPal sandbox** for additional testing
4. **Set up monitoring** and logging
5. **Add more test scenarios**

## 🆘 Support

If you encounter issues:
1. Check the logs: `docker logs erp-postgres`
2. Verify environment variables in `.env`
3. Ensure all services are running: `docker ps`
4. Try resetting the database: `npm run db:reset`
