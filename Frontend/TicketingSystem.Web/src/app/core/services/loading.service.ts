import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * ============================================================================
 * TicketingSystem - Loading Service
 * ============================================================================
 *
 * Provides centralized application-wide loading state.
 *
 * The service is intentionally small and follows the KISS principle.
 *
 * HTTP interceptors update the loading state automatically whenever an
 * HTTP request starts or finishes.
 *
 * Components such as the root AppComponent can subscribe to this state
 * and display a global loading indicator without knowing anything about
 * individual HTTP requests.
 * ============================================================================
 */

/**
 * Provides centralized state management for the application's global
 * loading indicator.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  /**
   * Tracks the number of currently active HTTP requests.
   *
   * A counter is used instead of a simple boolean because multiple HTTP
   * requests can execute at the same time.
   *
   * Example:
   *
   * Request A starts -> counter = 1
   * Request B starts -> counter = 2
   * Request A finishes -> counter = 1
   * Request B finishes -> counter = 0
   *
   * The loader remains visible until all active requests have finished.
   */
  private activeRequests = 0;

  /**
   * Stores the current global loading state.
   *
   * BehaviorSubject allows new subscribers to immediately receive the
   * current loading state.
   */
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  /**
   * Public read-only observable exposing the global loading state.
   *
   * Components should subscribe to this observable rather than modifying
   * the loading state directly.
   */
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  /**
   * Indicates that a new HTTP operation has started.
   *
   * The request counter is incremented and the loader becomes visible.
   */
  show(): void {
    this.activeRequests++;

    this.loadingSubject.next(true);
  }

  /**
   * Indicates that an HTTP operation has finished.
   *
   * The request counter is decremented and the loader is hidden only
   * when no active HTTP requests remain.
   */
  hide(): void {
    /**
     * Protect the counter from becoming negative if hide() is called
     * unexpectedly.
     */
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }

    /**
     * Hide the loader only when every active request has completed.
     */
    if (this.activeRequests === 0) {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Resets the loading state.
   *
   * This provides a safe recovery mechanism if the application ever
   * needs to forcefully clear the global loading indicator.
   */
  reset(): void {
    this.activeRequests = 0;

    this.loadingSubject.next(false);
  }
}
