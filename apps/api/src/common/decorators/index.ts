// ============================================
// Custom Decorators
// ============================================

import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

// Oznacza endpoint jako publiczny (pomija JWT guard)
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Wyciąga aktualnego użytkownika z requestu
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// Wymagane role
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
