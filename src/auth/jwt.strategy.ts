import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { UserRole } from './user.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  name: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    const secretKey = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-for-testing';
    console.log('JwtStrategy - JWT_SECRET from env:', process.env.JWT_SECRET);
    console.log('JwtStrategy - Using secret key:', secretKey);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey,
    });
  }

  async validate(payload: JwtPayload) {
    console.log('JWT Strategy - Payload received:', payload);
    const user = await this.authService.validateUser(payload.sub);
    console.log('JWT Strategy - User found:', user ? { id: user.id, email: user.email, role: user.role } : 'null');
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
