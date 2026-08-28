/**
 * ============================================================================
 * TicketingSystem - Toast Component
 * ============================================================================
 *
 * Displays application-wide toast notifications.
 *
 * The ToastService is located in the application's core services layer
 * because toast notifications are a global application concern.
 * ============================================================================
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import {
  ToastMessage,
  ToastService,
} from '../../../core/services/toast.service';

/**
 * Displays global toast notifications.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent implements OnInit, OnDestroy {
  /**
   * Currently visible toast notifications.
   */
  toasts: ToastMessage[] = [];

  /**
   * Subscription used to receive notifications from ToastService.
   */
  private toastSubscription?: Subscription;

  /**
   * Creates the toast component.
   *
   * @param toastService Global toast notification service.
   * @param changeDetectorRef Angular change detector.
   */
  constructor(
    private readonly toastService: ToastService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  /**
   * Starts listening for toast notifications.
   */
  ngOnInit(): void {
    this.toastSubscription = this.toastService.toasts$.subscribe(
      (toasts: ToastMessage[]) => {
        this.toasts = toasts;

        this.changeDetectorRef.markForCheck();
      },
    );
  }

  /**
   * Dismisses a toast notification.
   *
   * @param id Identifier of the toast.
   */
  dismiss(id: number): void {
    this.toastService.remove(id);
  }

  /**
   * Returns the visual icon for a toast type.
   *
   * @param type Toast type.
   * @returns Icon character.
   */
  getIcon(type: ToastMessage['type']): string {
    switch (type) {
      case 'success':
        return '✓';

      case 'error':
        return '!';

      case 'warning':
        return '⚠';

      case 'info':
      default:
        return 'i';
    }
  }

  /**
   * Releases the RxJS subscription when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.toastSubscription?.unsubscribe();
  }
}
