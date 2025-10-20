import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User, UserRole } from './user.entity';

/**
 * Authentication Service
 * Handles user authentication, registration, and JWT token management
 * Includes password hashing, validation, and user session management
 */
@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  /**
   * Register a new user
   * Validates email uniqueness and password strength
   */
  async signup(signupDto: { 
    name: string; 
    email: string; 
    password: string; 
    phone?: string;
    role?: UserRole 
  }): Promise<{ message: string; user: Partial<User> }> {
    const { name, email, password, phone, role = UserRole.CUSTOMER } = signupDto;

    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Validate password strength
    if (!this.isValidPassword(password)) {
      throw new BadRequestException('Password must be at least 8 characters long and contain at least one number and one letter');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = savedUser;
    return { 
      message: 'User created successfully', 
      user: userWithoutPassword 
    };
  }

  /**
   * Authenticate user login
   * Validates credentials and returns JWT token
   */
  async login(loginDto: { email: string; password: string }): Promise<{ 
    access_token: string; 
    user: Partial<User>;
    expiresIn: number;
  }> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      name: user.name 
    };

    const secretKey = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-for-testing';
    console.log('AuthService - JWT_SECRET from env:', process.env.JWT_SECRET);
    console.log('AuthService - Using secret key:', secretKey);
    const expiresIn = 24 * 60 * 60; // 24 hours in seconds

    const token = jwt.sign(payload, secretKey, { expiresIn });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token: token,
      user: userWithoutPassword,
      expiresIn,
    };
  }

  /**
   * Validate JWT token and return user
   */
  async validateUser(payload: any): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: number, 
    changePasswordDto: { 
      currentPassword: string; 
      newPassword: string 
    }
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password
    if (!this.isValidPassword(changePasswordDto.newPassword)) {
      throw new BadRequestException('New password must be at least 8 characters long and contain at least one number and one letter');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);

    // Update password
    user.password = hashedNewPassword;
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  /**
   * Get user profile
   */
  async getProfile(userId: number): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: number, 
    updateProfileDto: { 
      name?: string; 
      email?: string;
      phone?: string;
    }
  ): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if email is being changed and if it already exists
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({ 
        where: { email: updateProfileDto.email } 
      });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    Object.assign(user, updateProfileDto);
    const updatedUser = await this.userRepository.save(user);

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  private isValidPassword(password: string): boolean {
    // At least 8 characters, contains at least one number and one letter
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  }
}
