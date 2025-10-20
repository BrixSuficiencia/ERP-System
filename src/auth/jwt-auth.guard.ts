import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 * Extends the Passport JWT strategy to protect routes
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
