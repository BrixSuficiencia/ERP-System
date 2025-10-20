import { Controller, Post, Body, Get, Put, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserRole } from './user.entity';

/**
 * Authentication Controller
 * Handles user authentication, registration, and profile management
 * Includes JWT-based authentication and user session management
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * POST /auth/signup
   */
  @Post('signup')
  async signup(@Body() signupDto: { 
    name: string; 
    email: string; 
    password: string; 
    phone?: string;
    role?: UserRole 
  }) {
    return await this.authService.signup(signupDto);
  }

  /**
   * User login
   * POST /auth/login
   */
  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    return await this.authService.login(loginDto);
  }

  /**
   * Get user profile
   * GET /auth/profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return await this.authService.getProfile(req.user.id);
  }

  /**
   * Update user profile
   * PUT /auth/profile
   */
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: { name?: string; email?: string; phone?: string }
  ) {
    return await this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  /**
   * Change user password
   * PUT /auth/change-password
   */
  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: { currentPassword: string; newPassword: string }
  ) {
    return await this.authService.changePassword(req.user.id, changePasswordDto);
  }

  /**
   * Validate token (check if user is authenticated)
   * GET /auth/validate
   */
  @Get('validate')
  @UseGuards(JwtAuthGuard)
  async validate(@Request() req: any) {
    return {
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
      },
    };
  }
}
