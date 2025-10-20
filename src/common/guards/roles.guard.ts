import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../auth/user.entity';

/**
 * Roles Guard
 * Implements role-based access control for routes
 * Checks if the user has the required role to access a route
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the required roles from the route metadata
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log('RolesGuard - Required roles:', requiredRoles);

    // If no roles are specified, allow access
    if (!requiredRoles) {
      console.log('RolesGuard - No roles required, allowing access');
      return true;
    }

    // Get the user from the request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('RolesGuard - User from request:', user ? { id: user.id, email: user.email, role: user.role } : 'null');

    // If no user is found, deny access
    if (!user) {
      console.log('RolesGuard - No user found, denying access');
      return false;
    }

    // Check if the user has one of the required roles
    const hasRequiredRole = requiredRoles.some((role) => user.role === role);
    console.log('RolesGuard - User role:', user.role, 'Required roles:', requiredRoles, 'Has access:', hasRequiredRole);
    return hasRequiredRole;
  }
}
