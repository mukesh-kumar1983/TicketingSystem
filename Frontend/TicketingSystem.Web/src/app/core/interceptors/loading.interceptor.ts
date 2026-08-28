/**
 * ============================================================================
 * TicketingSystem - HTTP Loading Interceptor
 * ============================================================================
 *
 * Automatically displays the application's global loading indicator while
 * an HTTP request is being processed.
 *
 * The interceptor is intentionally independent from authentication.
 * Authentication remains the responsibility of authInterceptor.
 *
 * Every HTTP request:
 *
 *   Request starts
 *        ↓
 *   LoadingService.show()
 *        ↓
 *   HTTP request executes
 *        ↓
 *   HTTP request completes / fails
 *        ↓
 *   LoadingService.hide()
 *
 * The finalize() operator guarantees that the loading state is cleared
 * for both successful and failed HTTP requests.
 * ============================================================================
 */

import { inject } from '@angular/core';
import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { LoadingService } from '../services/loading.service';

/**
 * Intercepts HTTP requests and maintains the application's global
 * loading state.
 *
 * This interceptor does not modify the request itself.
 *
 * Its only responsibility is to notify LoadingService when an HTTP
 * request starts and when that request finishes.
 *
 * @param request The outgoing HTTP request.
 * @param next The next handler in the HTTP interceptor pipeline.
 * @returns An observable containing the HTTP response events.
 */
export function loadingInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  /**
   * Resolve LoadingService from Angular's dependency injection system.
   */
  const loadingService = inject(LoadingService);

  /**
   * Tell the global loading service that a request has started.
   */
  loadingService.show();

  /**
   * Continue processing the HTTP request.
   *
   * finalize() executes when the observable completes, errors, or is
   * unsubscribed from, ensuring that the loader cannot remain visible
   * because of a failed HTTP request.
   */
  return next(request).pipe(
    finalize(() => {
      loadingService.hide();
    }),
  );
}
