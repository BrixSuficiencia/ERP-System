# ERP Backend - Project Structure

## 📁 Directory Structure

```
erp-backend/
├── src/                          # Source code
│   ├── app.module.ts            # Main application module
│   ├── main.ts                  # Application entry point
│   ├── auth/                    # Authentication module
│   │   ├── auth.controller.ts   # Auth endpoints
│   │   ├── auth.service.ts      # Auth business logic
│   │   ├── auth.module.ts       # Auth module
│   │   ├── jwt.strategy.ts      # JWT authentication strategy
│   │   └── user.entity.ts       # User entity
│   ├── common/                  # Shared utilities
│   │   ├── decorators/          # Custom decorators
│   │   │   └── roles.decorator.ts
│   │   ├── dto/                 # Data Transfer Objects
│   │   │   └── create-customer.dto.ts
│   │   └── guards/              # Route guards
│   │       └── roles.guard.ts
│   ├── customers/               # Customer management
│   │   ├── customer.entity.ts
│   │   ├── customers.controller.ts
│   │   ├── customers.service.ts
│   │   └── customers.module.ts
│   ├── products/                # Product management
│   │   ├── product.entity.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── products.module.ts
│   ├── orders/                  # Order management
│   │   ├── order.entity.ts
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   └── orders.module.ts
│   ├── payments/                # Payment processing
│   │   ├── payment.entity.ts
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   └── payments.module.ts
│   ├── notifications/           # Real-time notifications
│   │   ├── notifications.gateway.ts
│   │   ├── notifications.service.ts
│   │   ├── notifications.controller.ts
│   │   └── notifications.module.ts
│   └── dashboard/               # Analytics & reporting
│       ├── dashboard.service.ts
│       ├── dashboard.controller.ts
│       └── dashboard.module.ts
├── env.example                  # Environment variables template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies and scripts
├── README.md                    # Project documentation
├── start.bat                    # Windows startup script
├── start.sh                     # Linux/Mac startup script
└── PROJECT_STRUCTURE.md         # This file
```

## 🏗️ Architecture Overview

### **Core Modules**
- **Authentication**: JWT-based auth with role-based access control
- **Products**: Product catalog and inventory management
- **Customers**: Customer profiles and management
- **Orders**: Order processing and lifecycle management
- **Payments**: Multi-gateway payment processing
- **Notifications**: Real-time WebSocket communications
- **Dashboard**: Business analytics and reporting

### **Shared Components**
- **Common**: Reusable decorators, DTOs, and guards
- **Entities**: Database models with TypeORM
- **Services**: Business logic and data processing
- **Controllers**: HTTP endpoints and request handling

## 🔧 Key Features

### **Real-time Notifications**
- WebSocket connections for live updates
- Order status notifications
- Payment confirmations
- Admin alerts

### **Payment Processing**
- Stripe integration
- PayPal integration
- Maya (Philippines) integration
- Refund handling

### **Business Intelligence**
- Sales analytics
- Customer insights
- Payment analytics
- Inventory tracking

### **Security**
- JWT authentication
- Role-based access control
- Password hashing
- Input validation

## 🚀 Getting Started

1. **Install dependencies**: `npm install`
2. **Configure environment**: Copy `env.example` to `.env`
3. **Setup database**: Create PostgreSQL database
4. **Start development**: `npm run start:dev` or use `start.bat`/`start.sh`

## 📊 API Endpoints

- **Authentication**: `/api/v1/auth/*`
- **Products**: `/api/v1/products/*`
- **Customers**: `/api/v1/customers/*`
- **Orders**: `/api/v1/orders/*`
- **Payments**: `/api/v1/payments/*`
- **Dashboard**: `/api/v1/dashboard/*`
- **Notifications**: `/api/v1/notifications/*`
- **WebSocket**: `ws://localhost:3000/notifications`

## 🔗 Dependencies

### **Core**
- NestJS framework
- TypeORM for database
- PostgreSQL database
- JWT for authentication

### **Payment Gateways**
- Stripe SDK
- PayPal integration
- Maya integration

### **Real-time**
- Socket.IO for WebSocket connections

### **Validation**
- class-validator for input validation
- class-transformer for data transformation
