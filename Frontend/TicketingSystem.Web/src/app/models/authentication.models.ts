/**
 * ============================================================================
 * TicketingSystem - Authentication Models
 * ============================================================================
 *
 * TypeScript models used by the authentication and current-user APIs.
 * ============================================================================
 */

/**
 * Represents the credentials submitted during login.
 */
export interface LoginRequest {
  /**
   * User's email address.
   */
  email: string;

  /**
   * User's password.
   */
  password: string;
}

/**
 * Represents the authentication response returned by the API.
 */
export interface LoginResponse {
  /**
   * JWT access token.
   */
  accessToken: string;

  /**
   * Authenticated user's identifier.
   */
  userId: string;

  /**
   * Authenticated user's first name.
   */
  firstName: string;

  /**
   * Authenticated user's last name.
   */
  lastName: string;

  /**
   * Authenticated user's full name.
   */
  fullName: string;

  /**
   * Authenticated user's email address.
   */
  email: string;

  /**
   * Authenticated user's application role.
   */
  role: string;
}

/**
 * Represents the currently authenticated user.
 */
export interface CurrentUser {
  /**
   * User identifier.
   */
  userId: string;

  /**
   * User's first name.
   */
  firstName: string;

  /**
   * User's last name.
   */
  lastName: string;

  /**
   * User's full name.
   */
  fullName: string;

  /**
   * User's email address.
   */
  email: string;

  /**
   * User's application role.
   */
  role: string;
}

/**
 * Represents the profile information submitted when updating
 * the authenticated user's account.
 */
export interface UpdateCurrentUserRequest {
  /**
   * New first name.
   */
  firstName: string;

  /**
   * New last name.
   */
  lastName: string;

  /**
   * New email address.
   */
  email: string;
}
