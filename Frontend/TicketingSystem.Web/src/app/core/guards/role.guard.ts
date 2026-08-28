import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * ============================================================================
 * TicketingSystem - Role Guard
 * ============================================================================
 *
 * Provides role-based route authorization for the Angular application.
 *
 * This file exposes a guard factory rather than a direct CanActivateFn.
 *
 * The factory accepts the roles that are allowed to access a route and returns
 * an Angular-compatible CanActivateFn.
 *
 * Example:
 *
 *     canActivate: [createRoleGuard(['Admin'])]
 *
 * or:
 *
 *     canActivate: [
 *       createRoleGuard(['Admin', 'SupportAgent', 'Customer'])
 *     ]
 *
 * Responsibilities:
 *
 * - Read the authenticated user's role from AuthService.
 * - Compare the user's role with the roles allowed by the route.
 * - Allow navigation when the current user's role is authorized.
 * - Prevent unauthorized users from directly navigating to protected URLs.
 * - Redirect unauthenticated users to the login page.
 * - Redirect authenticated users without the required role to the dashboard.
 *
 * IMPORTANT:
 *
 * Hiding a navigation item is only a user-interface concern.
 *
 * This guard provides an additional client-side protection layer so that a
 * user cannot simply type an unauthorized URL into the browser address bar.
 *
 * Backend API authorization remains the authoritative security boundary.
 * ============================================================================
 */

/**
 * Creates a role-based Angular route guard.
 *
 * The function name intentionally uses the "create" prefix to make it explicit
 * that this function is a factory which returns a CanActivateFn.
 *
 * This also prevents confusion with a direct Angular CanActivateFn, whose
 * signature receives:
 *
 *     (route, state)
 *
 * The returned guard receives those Angular parameters automatically when
 * Angular executes the guard during navigation.
 *
 * Example:
 *
 *     canActivate: [createRoleGuard(['Admin'])]
 *
 * Multiple roles can be supplied:
 *
 *     canActivate: [
 *       createRoleGuard(['Admin', 'SupportAgent', 'Customer'])
 *     ]
 *
 * Role comparison is case-insensitive.
 *
 * @param allowedRoles Application roles allowed to access the route.
 * @returns Angular CanActivateFn configured for the supplied roles.
 */
export function createRoleGuard(
  allowedRoles: readonly string[],
): CanActivateFn {
  /**
   * Return the actual Angular route guard.
   *
   * Angular calls this function with the ActivatedRouteSnapshot and
   * RouterStateSnapshot during route navigation.
   */
  return (
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): boolean => {
    /**
     * Resolve the required application services through Angular dependency
     * injection.
     */
    const authService = inject(AuthService);
    const router = inject(Router);

    /**
     * Retrieve the currently authenticated user.
     *
     * AuthService maintains the current user in memory and synchronizes it
     * with the authentication state stored by the application.
     */
    const currentUser = authService.getCurrentUserValue();

    /**
     * A missing current user means that the application does not currently
     * have enough information to authorize the requested route.
     *
     * The authentication guard normally handles this situation first.
     * This additional check keeps the role guard defensive.
     */
    if (!currentUser) {
      void router.navigate(['/login']);

      return false;
    }

    /**
     * Normalize the current user's role.
     *
     * This makes authorization tolerant of casing differences such as:
     *
     *     Admin
     *     admin
     *     ADMIN
     */
    const currentRole = currentUser.role?.trim().toLowerCase();

    /**
     * A user without a valid role cannot be authorized against the configured
     * role list.
     *
     * Redirect the authenticated user to the dashboard.
     */
    if (!currentRole) {
      void router.navigate(['/dashboard']);

      return false;
    }

    /**
     * Normalize all configured allowed roles before comparing them with the
     * current user's role.
     *
     * Empty role values are ignored defensively.
     */
    const normalizedAllowedRoles = allowedRoles
      .filter((role) => !!role)
      .map((role) => role.trim().toLowerCase());

    /**
     * Allow navigation when the authenticated user's role is explicitly
     * included in the route's allowed role list.
     */
    if (normalizedAllowedRoles.includes(currentRole)) {
      return true;
    }

    /**
     * The user is authenticated but does not have permission to access the
     * requested route.
     *
     * Redirect the user to the dashboard rather than leaving them on a
     * forbidden route.
     */
    void router.navigate(['/dashboard']);

    return false;
  };
}
