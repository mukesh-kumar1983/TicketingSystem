import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import {
  CreateTicketRequest,
  getTicketPriorityLabel,
  TicketPriority,
} from '../../../models/ticket.models';
import { TicketService } from '../../../core/services/ticket.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Displays the Create Ticket page.
 *
 * Only administrators and customers are permitted to create tickets.
 * The backend remains the authoritative security boundary.
 */
@Component({
  selector: 'app-create-ticket',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-ticket.component.html',
  styleUrls: ['./create-ticket.component.scss'],
})
export class CreateTicketComponent {
  /**
   * API error message.
   */
  errorMessage = '';

  /**
   * Ticket priorities displayed by the priority dropdown.
   */
  readonly ticketPriorities = [
    {
      value: TicketPriority.Low,
      label: getTicketPriorityLabel(TicketPriority.Low),
    },
    {
      value: TicketPriority.Medium,
      label: getTicketPriorityLabel(TicketPriority.Medium),
    },
    {
      value: TicketPriority.High,
      label: getTicketPriorityLabel(TicketPriority.High),
    },
    {
      value: TicketPriority.Critical,
      label: getTicketPriorityLabel(TicketPriority.Critical),
    },
  ];

  /**
   * Indicates whether the current user is allowed to create tickets.
   */
  readonly canCreateTicket: boolean;

  /**
   * Reactive ticket-creation form.
   */
  readonly ticketForm = this.formBuilder.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(5000)]],
    priority: [TicketPriority.Medium, [Validators.required]],
  });

  /**
   * Creates the component.
   */
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly ticketService: TicketService,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {
    this.canCreateTicket = this.isAdminOrCustomer();

    if (!this.canCreateTicket) {
      this.errorMessage =
        'Only administrators and customers can create tickets.';
    }
  }

  /**
   * Gets the title control.
   */
  get titleControl() {
    return this.ticketForm.controls.title;
  }

  /**
   * Gets the description control.
   */
  get descriptionControl() {
    return this.ticketForm.controls.description;
  }

  /**
   * Gets the priority control.
   */
  get priorityControl() {
    return this.ticketForm.controls.priority;
  }

  /**
   * Determines whether the authenticated user is an administrator
   * or customer.
   */
  private isAdminOrCustomer(): boolean {
    const auth = this.authService as any;

    const role =
      auth.getRole?.() ??
      auth.currentUser?.()?.role ??
      auth.currentUserValue?.role ??
      auth.user?.()?.role ??
      '';

    return (
      String(role).toLowerCase() === 'admin' ||
      String(role).toLowerCase() === 'customer'
    );
  }

  /**
   * Submits the ticket.
   */
  submit(): void {
    if (!this.canCreateTicket) {
      this.errorMessage =
        'Only administrators and customers can create tickets.';
      return;
    }

    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';

    const formValue = this.ticketForm.getRawValue();

    const request: CreateTicketRequest = {
      title: formValue.title?.trim() ?? '',
      description: formValue.description?.trim() ?? '',
      priority: formValue.priority ?? TicketPriority.Medium,
    };

    this.ticketService.createTicket(request).subscribe({
      next: () => {
        this.router.navigate(['/tickets']);
      },

      error: (error) => {
        if (error.status === 401) {
          this.errorMessage = 'Your session has expired. Please sign in again.';
          return;
        }

        if (error.status === 403) {
          this.errorMessage =
            'Only administrators and customers can create tickets.';
          return;
        }

        if (error.status === 400) {
          this.errorMessage =
            'Please check the ticket information and try again.';
          return;
        }

        this.errorMessage = 'Unable to create the ticket. Please try again.';
      },
    });
  }

  /**
   * Cancels ticket creation.
   */
  cancel(): void {
    this.router.navigate(['/tickets']);
  }
}
