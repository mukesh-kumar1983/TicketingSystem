/**
 * ============================================================================
 * TicketingSystem - Global Loading Component
 * ============================================================================
 *
 * Displays the application's global HTTP loading indicator.
 *
 * The component does not initiate or terminate HTTP requests.
 * It simply observes LoadingService.loading$ and renders the appropriate
 * visual state.
 *
 * The actual loading-state management is handled by LoadingService and
 * loadingInterceptor.
 * ============================================================================
 */

import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LoadingService } from '../../../core/services/loading.service';

/**
 * Displays a global loading indicator while HTTP requests are active.
 */
@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [NgIf, AsyncPipe],
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingComponent {
  /**
   * Observable representing the current global HTTP loading state.
   *
   * The async pipe in the template automatically subscribes to and
   * unsubscribes from this observable.
   */
  readonly loading$ = this.loadingService.loading$;

  /**
   * Creates the global loading component.
   *
   * @param loadingService Centralized application loading-state service.
   */
  constructor(private readonly loadingService: LoadingService) {}
}
