import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1) Check for userId
    if (!request.userId) {
      throw new UnauthorizedException('User id not found');
    }

    // 2) Get route permissions metadata
    const routePermissions = this.reflector.getAllAndOverride(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Route does not require any permission
    if (!routePermissions) {
      return true;
    }

    try {
      // 3) Load user permissions from database
      const userPermissions = await this.userService.getUserPermissions(
        request.userId,
      );

      // 4) Compare user permissions with required permissions
      for (const routePermission of routePermissions) {
        const userPermission = userPermissions.find(
          (perm) => perm.resource === routePermission.resource,
        );

        if (!userPermission) {
          throw new ForbiddenException(
            'User does not have required resource permission',
          );
        }

        const missingActions = routePermission.actions.filter(
          (requiredAction) => !userPermission.actions.includes(requiredAction),
        );

        if (missingActions.length > 0) {
          throw new ForbiddenException(
            `User missing required actions: ${missingActions.join(', ')}`,
          );
        }
      }
    } catch (error) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
