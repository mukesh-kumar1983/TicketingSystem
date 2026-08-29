import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { TicketService } from '../../core/services/ticket.service';

import { CurrentUser } from '../../models/authentication.models';
import {
  TicketPriority,
  TicketQueryResponse,
  TicketResponse,
  TicketStatus,
} from '../../models/ticket.models';

/**

* ============================================================================
* TicketingSystem - Dashboard Component
* ============================================================================
*
* Displays the authenticated user's dashboard.
*
* Responsibilities:
*
* * Load the currently authenticated user.
* * Load ticket statistics.
* * Load the five most recently created tickets.
* * Display ticket counts by status.
* * Display recent ticket information.
* * Format ticket status labels.
* * Format ticket priority labels.
* * Handle authentication failures.
* * Handle ticket API failures.
* * Log the user out and navigate to the login page.
*
* The component uses the existing AuthService and TicketService abstractions.
* No direct HTTP calls are performed here.
*
* The component is intentionally kept simple and follows the existing
* TicketingSystem architecture.
* ============================================================================
  */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  /**

  * Currently authenticated user.
  *
  * Remains null until the current-user API request completes successfully.
    */
  currentUser: CurrentUser | null = null;

  /**
  
  * Total number of tickets available to the authenticated user.
    */
  totalTickets = 0;

  /**
  
  * Number of tickets currently in Open status.
    */
  openTickets = 0;

  /**
  
  * Number of tickets currently In Progress.
    */
  inProgressTickets = 0;

  /**
  
  * Number of tickets currently Resolved.
    */
  resolvedTickets = 0;

  /**
  
  * Number of tickets currently Closed.
    */
  closedTickets = 0;

  /**
  
  * Most recently created tickets.
  *
  * The dashboard displays a maximum of five tickets.
    */
  recentTickets: TicketResponse[] = [];

  /**
  
  * Indicates whether the dashboard is currently loading.
    */
  isLoading = true;

  /**
  
  * User-facing dashboard error message.
  *
  * An empty string indicates that no error exists.
    */
  errorMessage = '';

  /**
  
  * Exposes the TicketStatus enum to the Angular template.
  *
  * This allows the template to compare ticket statuses without hard-coded
  * numeric enum values.
    */
  readonly ticketStatus = TicketStatus;

  /**
  
  * Exposes the TicketPriority enum to the Angular template.
  *
  * This allows the template to compare ticket priorities without hard-coded
  * numeric enum values.
    */
  readonly ticketPriority = TicketPriority;

  /**
  
  * Creates an instance of DashboardComponent.
  *
  * @param authService Authentication service used to retrieve the current
  * authenticated user and perform logout.
  * @param ticketService Ticket service used to retrieve dashboard ticket data.
  * @param router Angular router used to navigate to the login page.
    */
  constructor(
    private readonly authService: AuthService,
    private readonly ticketService: TicketService,
    private readonly router: Router,
  ) {}

  /**
  
  * Initializes the dashboard.
  *
  * The authenticated user must be loaded successfully before ticket
  * information is requested.
    */
  ngOnInit(): void {
    this.loadCurrentUser();
  }

  /**
  
  * Loads the currently authenticated user.
  *
  * Ticket information is requested only after the current-user request
  * succeeds. This prevents unnecessary ticket API calls when authentication
  * is no longer valid.
    */
  private loadCurrentUser(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.getCurrentUser().subscribe({
      next: (user: CurrentUser) => {
        this.currentUser = user;
        this.loadTicketData();
      },

      error: (error: unknown) => {
        this.handleAuthenticationError(error);
      },
    });
  }

  /**
  
  * Loads all dashboard ticket information.
  *
  * Six requests are performed:
  *
  * 1. Total tickets.
  * 2. Open tickets.
  * 3. In-progress tickets.
  * 4. Resolved tickets.
  * 5. Closed tickets.
  * 6. Five most recently created tickets.
  *
  * forkJoin waits until all requests complete successfully. If any request
  * fails, the combined observable enters its error handler.
    */
  private loadTicketData(): void {
    const requests = {
      total: this.ticketService.getTickets({
        pageNumber: 1,
        pageSize: 1,
      }),

      open: this.ticketService.getTickets({
        pageNumber: 1,
        pageSize: 1,
        status: TicketStatus.Open,
      }),

      inProgress: this.ticketService.getTickets({
        pageNumber: 1,
        pageSize: 1,
        status: TicketStatus.InProgress,
      }),

      resolved: this.ticketService.getTickets({
        pageNumber: 1,
        pageSize: 1,
        status: TicketStatus.Resolved,
      }),

      closed: this.ticketService.getTickets({
        pageNumber: 1,
        pageSize: 1,
        status: TicketStatus.Closed,
      }),

      recent: this.ticketService.getTickets({
        pageNumber: 1,
        pageSize: 5,
        sortBy: 'CreatedAt',
        sortDescending: true,
      }),
    };

    forkJoin(requests).subscribe({
      next: (responses) => {
        this.applyTicketResponses(responses);

        this.isLoading = false;
      },

      error: (error: unknown) => {
        this.handleTicketError(error);
      },
    });
  }

  /**
  
  * Applies the ticket API responses to the dashboard state.
  *
  * TotalCount is intentionally used for ticket statistics rather than the
  * number of records returned in the Items collection. Statistics requests
  * use PageSize = 1, so Items normally contains at most one record.
  *
  * @param responses Ticket responses returned by the six dashboard queries.
    */
  private applyTicketResponses(responses: {
    total: TicketQueryResponse;
    open: TicketQueryResponse;
    inProgress: TicketQueryResponse;
    resolved: TicketQueryResponse;
    closed: TicketQueryResponse;
    recent: TicketQueryResponse;
  }): void {
    this.totalTickets = responses.total.totalCount;
    this.openTickets = responses.open.totalCount;
    this.inProgressTickets = responses.inProgress.totalCount;
    this.resolvedTickets = responses.resolved.totalCount;
    this.closedTickets = responses.closed.totalCount;

    this.recentTickets = responses.recent.items ?? [];
  }

  /**
  
  * Handles an error returned while retrieving the current authenticated user.
  *
  * A 401 response means that the authentication session is no longer valid.
  * In that case the user is logged out and redirected to the login page.
  *
  * Other errors are presented as a dashboard error without logging the user
  * out.
  *
  * @param error Error returned by the authentication API.
    */
  private handleAuthenticationError(error: unknown): void {
    this.isLoading = false;

    if (this.getHttpStatus(error) === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);

      this.errorMessage = '';

      return;
    }

    this.errorMessage = 'Unable to retrieve your account information.';
  }

  /**
  
  * Handles an error returned while retrieving ticket information.
  *
  * A 401 response means that the authentication session is no longer valid.
  * In that case the user is logged out and redirected to the login page.
  *
  * Other errors are presented to the user while keeping the current
  * authentication state intact.
  *
  * @param error Error returned by the ticket API.
    */
  private handleTicketError(error: unknown): void {
    this.isLoading = false;

    if (this.getHttpStatus(error) === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);

      this.errorMessage = '';

      return;
    }

    this.errorMessage =
      'Unable to retrieve ticket information from the server.';
  }

  /**
  
  * Extracts an HTTP status code from an unknown error value.
  *
  * Angular HTTP errors normally expose a numeric `status` property. The
  * defensive implementation keeps the component safe when tests or other
  * callers provide a different error shape.
  *
  * @param error Unknown error value.
  * @returns HTTP status code when available; otherwise zero.
    */
  private getHttpStatus(error: unknown): number {
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const status = (error as { status?: unknown }).status;

      return typeof status === 'number' ? status : 0;
    }

    return 0;
  }

  /**
  
  * Returns the display label for a ticket status.
  *
  * @param status Ticket workflow status.
  * @returns Human-readable status label.
    */
  getStatusLabel(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.Open:
        return 'Open';

      case TicketStatus.InProgress:
        return 'In Progress';

      case TicketStatus.Resolved:
        return 'Resolved';

      case TicketStatus.Closed:
        return 'Closed';

      default:
        return 'Unknown';
    }
  }

  /**
  
  * Returns the display label for a ticket priority.
  *
  * @param priority Ticket priority.
  * @returns Human-readable priority label.
    */
  getPriorityLabel(priority: TicketPriority): string {
    switch (priority) {
      case TicketPriority.Low:
        return 'Low';

      case TicketPriority.Medium:
        return 'Medium';

      case TicketPriority.High:
        return 'High';

      case TicketPriority.Critical:
        return 'Critical';

      default:
        return 'Unknown';
    }
  }

  /**
  
  * Logs out the currently authenticated user and navigates to the login page.
  *
  * The authentication service remains responsible for clearing the
  * authentication token and other authentication state.
    */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
