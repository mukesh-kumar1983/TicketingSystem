/**
 * ============================================================================
 * TicketingSystem - Toast Service
 * ============================================================================
 *
 * Provides application-wide toast notifications.
 *
 * Responsibilities:
 *
 * - Display success messages.
 * - Display error messages.
 * - Display informational messages.
 * - Display warning messages.
 * - Automatically remove messages after a configurable duration.
 *
 * The service uses an RxJS observable so that the ToastComponent can listen
 * for notifications regardless of which page or service creates them.
 * ============================================================================
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Represents the supported toast notification types.
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Represents a single toast notification.
 */
export interface ToastMessage {
  /**
   * Unique identifier of the toast.
   */
  id: number;

  /**
   * Visual type of the toast.
   */
  type: ToastType;

  /**
   * Message displayed to the user.
   */
  message: string;

  /**
   * Duration in milliseconds before the toast disappears.
   */
  duration: number;
}

/**
 * Provides application-wide toast notification functionality.
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  /**
   * Internal collection of currently visible toast messages.
   */
  private readonly toastSubject = new BehaviorSubject<ToastMessage[]>([]);

  /**
   * Public observable consumed by ToastComponent.
   */
  readonly toasts$: Observable<ToastMessage[]> =
    this.toastSubject.asObservable();

  /**
   * Internal counter used to generate unique toast identifiers.
   */
  private nextId = 1;

  /**
   * Displays a success notification.
   *
   * @param message Message displayed to the user.
   * @param duration Duration in milliseconds.
   */
  success(message: string, duration = 4000): void {
    this.show('success', message, duration);
  }

  /**
   * Displays an error notification.
   *
   * @param message Message displayed to the user.
   * @param duration Duration in milliseconds.
   */
  error(message: string, duration = 5000): void {
    this.show('error', message, duration);
  }

  /**
   * Displays an informational notification.
   *
   * @param message Message displayed to the user.
   * @param duration Duration in milliseconds.
   */
  info(message: string, duration = 4000): void {
    this.show('info', message, duration);
  }

  /**
   * Displays a warning notification.
   *
   * @param message Message displayed to the user.
   * @param duration Duration in milliseconds.
   */
  warning(message: string, duration = 4500): void {
    this.show('warning', message, duration);
  }

  /**
   * Removes a specific toast notification.
   *
   * @param id Identifier of the toast to remove.
   */
  remove(id: number): void {
    const currentToasts = this.toastSubject.value;

    this.toastSubject.next(currentToasts.filter((toast) => toast.id !== id));
  }

  /**
   * Removes all currently visible toast notifications.
   */
  clear(): void {
    this.toastSubject.next([]);
  }

  /**
   * Creates and displays a toast notification.
   *
   * @param type Toast notification type.
   * @param message Message displayed to the user.
   * @param duration Duration in milliseconds.
   */
  private show(type: ToastType, message: string, duration: number): void {
    const toast: ToastMessage = {
      id: this.nextId++,
      type,
      message,
      duration,
    };

    this.toastSubject.next([...this.toastSubject.value, toast]);

    if (duration > 0) {
      window.setTimeout(() => {
        this.remove(toast.id);
      }, duration);
    }
  }
}
