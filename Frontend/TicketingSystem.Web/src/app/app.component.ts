/**
 * ============================================================================
 * TicketingSystem - Root Application Component
 * ============================================================================
 *
 * Root component of the Angular application.
 *
 * Responsibilities:
 *
 * - Provides the application's RouterOutlet.
 * - Hosts the global HTTP loading indicator.
 * - Hosts the global toast notification component.
 *
 * Page-specific components remain responsible for their own content,
 * while application-wide concerns are handled centrally here.
 * ============================================================================
 */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LoadingComponent } from './shared/components/loading/loading.component';
import { ToastComponent } from './shared/components/toast/toast.component';

/**
 * Root component of the TicketingSystem Angular application.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {}
