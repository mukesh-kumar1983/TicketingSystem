/**
 * ============================================================================
 * TicketingSystem - Production Environment Configuration
 * ============================================================================
 *
 * Contains configuration values used by the Angular application when running
 * against a production backend.
 */
export const environment = {
  /**
   * Indicates whether the Angular application is running in production mode.
   */
  production: true,

  /**
   * Base URL of the TicketingSystem API.
   *
   * The `/api` segment is intentionally included here so that individual
   * services only need to append their controller endpoint.
   */
  apiUrl: 'https://localhost:7223/api',
};
