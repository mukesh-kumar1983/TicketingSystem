/**
 * ============================================================================
 * TicketingSystem - User Models
 * ============================================================================
 *
 * Contains TypeScript models used by the Angular application when working
 * with Customer and SupportAgent accounts.
 *
 * These models correspond to the DTOs exposed by the ASP.NET Core API.
 * ============================================================================
 */

/**
 * Represents the application roles that can be managed through the
 * administration area.
 *
 * Administrators are intentionally excluded because Admin accounts are not
 * managed through the Customer/Agent management screens.
 */
export type ManagedUserRole = 'Customer' | 'SupportAgent';

/**
 * Represents a Customer or SupportAgent returned by the API.
 */
export interface UserResponse {
  /**
   * ASP.NET Core Identity user identifier.
   */
  id: string;

  /**
   * User's first name.
   */
  firstName: string;

  /**
   * User's last name.
   */
  lastName: string;

  /**
   * User's email address.
   */
  email: string;

  /**
   * Application role assigned to the user.
   */
  role: ManagedUserRole;
}

/**
 * Represents the information required to create a new Customer or
 * SupportAgent.
 */
export interface CreateUserRequest {
  /**
   * User's first name.
   */
  firstName: string;

  /**
   * User's last name.
   */
  lastName: string;

  /**
   * User's email address.
   */
  email: string;

  /**
   * Initial password for the new account.
   */
  password: string;

  /**
   * Application role assigned to the new account.
   */
  role: ManagedUserRole;
}

/**
 * Represents the information required to update an existing Customer or
 * SupportAgent.
 *
 * The password is intentionally not included here.
 *
 * Password management should be handled separately rather than silently
 * changing a user's password during normal profile editing.
 */
export interface UpdateUserRequest {
  /**
   * Updated first name.
   */
  firstName: string;

  /**
   * Updated last name.
   */
  lastName: string;

  /**
   * Updated email address.
   */
  email: string;

  /**
   * Updated application role.
   */
  role: ManagedUserRole;
}
