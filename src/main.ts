import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Bootstrap function to start the ERP backend application
 * Configures global validation, CORS, and other middleware
 */
async function bootstrap() {
  console.log('Bootstrap - JWT_SECRET from env:', process.env.JWT_SECRET);
  console.log('Bootstrap - All env vars:', Object.keys(process.env).filter(key => key.includes('JWT')));
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend integration
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:5173', // Vite development server
      'http://localhost:3000', // React development server
      'http://localhost:4200', // Angular development server
    ],
    credentials: true,
  });

  // Global validation pipe for DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties that don't have decorators
    forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
    transform: true, // Automatically transform payloads to DTO instances
  }));

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 ERP Backend is running on: http://localhost:${port}`);
  console.log(`📊 API Documentation: http://localhost:${port}/api/v1`);
}
bootstrap();
