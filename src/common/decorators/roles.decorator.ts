import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../auth/user.entity';

/**
 * Roles Decorator
 * Used to specify which roles are allowed to access a route
 * @param roles - Array of user roles that can access the route
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
