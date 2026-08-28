import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Protects routes that require an authenticated user.
 *
 * The guard checks whether a JWT access token exists in browser
 * localStorage. If no token exists, the user is redirected to
 * the login page.
 *
 * Server-side validation of the token remains the responsibility
 * of ASP.NET Core's JWT authentication middleware.
 */
export const authGuard: CanActivateFn = () => {
  /**
   * Retrieve the authentication service from Angular's dependency
   * injection system.
   */
  const authService = inject(AuthService);

  /**
   * Retrieve Angular's Router so that unauthenticated users can
   * be redirected to the login page.
   */
  const router = inject(Router);

  /**
   * Allow the request to continue when an access token exists.
   */
  if (authService.isAuthenticated()) {
    return true;
  }

  /**
   * No access token exists, so redirect the user to login.
   *
   * The UrlTree is returned instead of calling router.navigate()
   * directly. This is Angular's recommended approach for guards.
   */
  return router.createUrlTree(['/login']);
};
