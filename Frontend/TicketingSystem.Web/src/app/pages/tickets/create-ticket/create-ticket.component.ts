File: `src/app/pages/create-ticket/create-ticket.component.ts`;

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

* ============================================================================
* TicketingSystem - Create Ticket Component
* ============================================================================
*
* Displays the Create Ticket page and handles creation of new support
* tickets.
*
* Only administrators and customers are permitted to create tickets.
*
* The backend remains the authoritative security boundary. The frontend
* permission check exists to provide an appropriate user experience and to
* prevent users who are known not to have permission from submitting the form.
*
* ============================================================================
* ROLE HANDLING
* ============================================================================
*
* The authenticated user's role is obtained from AuthService through its
* strongly typed getCurrentUserValue() method.
*
* This component previously attempted to discover the user's role using
* several guessed properties and methods through `any`. Those members do not
* exist in the current AuthService implementation and caused the role to be
* resolved as an empty string.
*
* The component now uses the actual AuthService API:
*
* 
  authService.getCurrentUserValue()?.role
  
*
* This ensures that an authenticated Admin or Customer is correctly allowed
* to create tickets.
*
* ============================================================================
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

  * API or permission error message displayed to the user.
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
  
  * Indicates whether the current authenticated user is allowed to create
  * tickets.
  *
  * Administrators and customers are allowed to create tickets.
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
  
  * Creates the CreateTicketComponent.
  *
  * @param formBuilder Angular FormBuilder used to construct the ticket form.
  * @param ticketService Service used to communicate with the ticket API.
  * @param router Angular Router used for navigation.
  * @param authService Authentication service used to determine the current
  * authenticated user's role.
    */
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly ticketService: TicketService,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {
    /**
  
    * Determine the user's ticket-creation permission using the actual
    * strongly typed AuthService API.
      */
    this.canCreateTicket = this.isAdminOrCustomer();

    /**


      
 * Display a permission message when the authenticated user does not have
 * permission to create tickets.
 */
    if (!this.canCreateTicket) {
      this.errorMessage =
        'Only administrators and customers can create tickets.';
    }
  }

  /**
  
  * Gets the title form control.
  *
  * @returns The ticket title control.
    */
  get titleControl() {
    return this.ticketForm.controls.title;
  }

  /**
  
  * Gets the description form control.
  *
  * @returns The ticket description control.
    */
  get descriptionControl() {
    return this.ticketForm.controls.description;
  }

  /**
  
  * Gets the priority form control.
  *
  * @returns The ticket priority control.
    */
  get priorityControl() {
    return this.ticketForm.controls.priority;
  }

  /**
  
  * Determines whether the authenticated user is an administrator
  * or customer.
  *
  * The current user is obtained directly from AuthService using its
  * getCurrentUserValue() method.
  *
  * Role comparison is case-insensitive so that values such as "Admin",
  * "admin", "Customer", or "customer" are handled consistently.
  *
  * @returns True when the current user is an administrator or customer;
  * otherwise false.
    */
  private isAdminOrCustomer(): boolean {
    const currentUser = this.authService.getCurrentUserValue();

    const role = currentUser?.role?.trim().toLowerCase() ?? '';

    return role === 'admin' || role === 'customer';
  }

  /**
  
  * Submits the ticket creation form.
  *
  * The request is sent to the TicketService only after the frontend
  * permission check and form validation have succeeded.
    */
  submit(): void {
    /**
  
    * Prevent users without the required role from submitting the form.
    *
    * The backend still performs the authoritative authorization check.
      */
    if (!this.canCreateTicket) {
      this.errorMessage =
        'Only administrators and customers can create tickets.';
      return;
    }

    /**


      
 * Prevent submission when required form fields are invalid.
 */
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    /**
     * Clear any previous error message before submitting.
     */
    this.errorMessage = '';

    /**
     * Read the current form values.
     */
    const formValue = this.ticketForm.getRawValue();

    /**
     * Build the API request.
     */
    const request: CreateTicketRequest = {
      title: formValue.title?.trim() ?? '',
      description: formValue.description?.trim() ?? '',
      priority: formValue.priority ?? TicketPriority.Medium,
    };

    /**
     * Send the ticket creation request to the backend.
     */
    this.ticketService.createTicket(request).subscribe({
      /**
       * Ticket was successfully created.
       */
      next: () => {
        this.router.navigate(['/tickets']);
      },

      /**
       * Handle API errors.
       *
       * @param error HTTP error returned by the backend.
       */
      error: (error) => {
        /**
         * Authentication failure.
         */
        if (error.status === 401) {
          this.errorMessage = 'Your session has expired. Please sign in again.';
          return;
        }

        /**
         * Authorization failure.
         *
         * This is kept as a defensive backend error handler even though
         * Admin and Customer users should already pass the frontend check.
         */
        if (error.status === 403) {
          this.errorMessage =
            'Only administrators and customers can create tickets.';
          return;
        }

        /**
         * Validation failure returned by the API.
         */
        if (error.status === 400) {
          this.errorMessage =
            'Please check the ticket information and try again.';
          return;
        }

        /**
         * Unexpected API or network failure.
         */
        this.errorMessage = 'Unable to create the ticket. Please try again.';
      },
    });
  }

  /**
  
  * Cancels ticket creation and returns to the tickets page.
    */
  cancel(): void {
    this.router.navigate(['/tickets']);
  }
}
