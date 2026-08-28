import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

/**
 * ============================================================================
 * TicketingSystem - Application Configuration
 * ============================================================================
 *
 * Root dependency-injection configuration for the Angular application.
 *
 * Responsibilities:
 *
 * - Register application routes.
 * - Register Angular HttpClient.
 * - Register the authentication interceptor.
 * - Register the global HTTP loading interceptor.
 * ============================================================================
 */

/**
 * Root application configuration.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    /**
     * Registers the application's route configuration.
     *
     * This allows Angular to resolve the routes defined in app.routes.ts
     * and render routed components through RouterOutlet.
     */
    provideRouter(routes),

    /**
     * Registers Angular HttpClient.
     *
     * Two HTTP interceptors are registered:
     *
     * 1. authInterceptor
     *    Adds the JWT access token to authenticated API requests.
     *
     * 2. loadingInterceptor
     *    Automatically displays the global loading indicator while
     *    HTTP requests are running.
     *
     * Interceptors are executed as an HTTP pipeline, so neither
     * responsibility needs to be implemented inside individual
     * components or services.
     */
    provideHttpClient(withInterceptors([authInterceptor, loadingInterceptor])),
  ],
};
