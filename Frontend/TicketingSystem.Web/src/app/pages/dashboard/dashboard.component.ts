import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { TicketService } from '../../core/services/ticket.service';
import { CurrentUser } from '../../models/authentication.models';
import {
  TicketPriority,
  TicketQueryResponse,
  TicketResponse,
  TicketStatus,
  getTicketPriorityLabel,
  getTicketStatusLabel,
} from '../../models/ticket.models';

/**
 * Represents the authenticated user's dashboard.
 *
 * The dashboard displays real information retrieved from the
 * TicketingSystem API.
 *
 * The dashboard currently retrieves:
 *
 * - The authenticated user's information.
 * - Total ticket count.
 * - Open ticket count.
 * - In-progress ticket count.
 * - Resolved ticket count.
 * - Closed ticket count.
 * - The five most recently created tickets.
 *
 * No ticket statistics are hard-coded in this component.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  /**
   * Currently authenticated user.
   */
  currentUser: CurrentUser | null = null;

  /**
   * Total number of tickets visible to the authenticated user.
   */
  totalTickets = 0;

  /**
   * Number of open tickets.
   */
  openTickets = 0;

  /**
   * Number of tickets currently being worked on.
   */
  inProgressTickets = 0;

  /**
   * Number of resolved tickets.
   */
  resolvedTickets = 0;

  /**
   * Number of closed tickets.
   */
  closedTickets = 0;

  /**
   * Most recently created tickets.
   */
  recentTickets: TicketResponse[] = [];

  /**
   * Indicates whether dashboard data is being loaded.
   */
  isLoading = true;

  /**
   * Contains a user-friendly error message when an API request fails.
   */
  errorMessage = '';

  /**
   * Exposes the ticket status enum to the template.
   *
   * Angular templates cannot directly access imported TypeScript
   * enums unless they are exposed through the component.
   */
  readonly ticketStatus = TicketStatus;

  /**
   * Exposes the ticket priority enum to the template.
   */
  readonly ticketPriority = TicketPriority;

  /**
   * Creates an instance of DashboardComponent.
   *
   * @param authService Application authentication service.
   * @param ticketService Application ticket service.
   * @param router Angular router.
   */
  constructor(
    private readonly authService: AuthService,
    private readonly ticketService: TicketService,
    private readonly router: Router,
  ) {}

  /**
   * Initializes the dashboard.
   */
  ngOnInit(): void {
    this.loadDashboard();
  }

  /**
   * Loads all dashboard information.
   *
   * The authenticated user is loaded first because the dashboard
   * should only display information after authentication has been
   * successfully established.
   */
  private loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.getCurrentUser().subscribe({
      /**
       * Authentication information was retrieved successfully.
       */
      next: (user) => {
        this.currentUser = user;

        this.loadTicketStatistics();
      },

      /**
       * Authentication request failed.
       */
      error: (error) => {
        this.isLoading = false;

        /**
         * A 401 means that the stored JWT is no longer valid.
         */
        if (error.status === 401) {
          this.authService.logout();

          this.router.navigate(['/login']);

          return;
        }

        this.errorMessage = 'Unable to retrieve your account information.';
      },
    });
  }

  /**
   * Loads ticket statistics and recent tickets from the API.
   *
   * The existing Tickets API supports status filtering and returns
   * TotalCount for the complete filtered result set.
   *
   * Therefore we can calculate accurate dashboard statistics without
   * introducing a new dashboard-specific backend endpoint.
   */
  private loadTicketStatistics(): void {
    forkJoin({
      /**
       * Retrieves the total number of tickets.
       */
      total: this.ticketService.getTickets({
        pageNumber: 1,
        pageSize: 1,
      }),

      /**
       * Retrieves the total number of open tickets.
       */
      open: this.ticketService.getTickets({
        pageNumber: 1,
        pageSize: 1,
        status: TicketStatus.Open,
      }),

      /**
       * Retrieves the total number of in-progress tickets.
       */
      inProgress: this.ticketService.getTickets({
        pageNumber: 1,
        pageSize: 1,
        status: TicketStatus.InProgress,
      }),

      /**
       * Retrieves the total number of resolved tickets.
       */
      resolved: this.ticketService.getTickets({
        pageNumber: 1,
        pageSize: 1,
        status: TicketStatus.Resolved,
      }),

      /**
       * Retrieves the total number of closed tickets.
       */
      closed: this.ticketService.getTickets({
        pageNumber: 1,
        pageSize: 1,
        status: TicketStatus.Closed,
      }),

      /**
       * Retrieves the five most recently created tickets.
       */
      recent: this.ticketService.getTickets({
        pageNumber: 1,
        pageSize: 5,
        sortBy: 'CreatedAt',
        sortDescending: true,
      }),
    }).subscribe({
      /**
       * All ticket requests completed successfully.
       */
      next: (responses) => {
        this.applyTicketStatistics(responses);

        this.isLoading = false;
      },

      /**
       * At least one ticket request failed.
       */
      error: (error) => {
        this.isLoading = false;

        /**
         * If the API rejects the JWT, return to the login page.
         */
        if (error.status === 401) {
          this.authService.logout();

          this.router.navigate(['/login']);

          return;
        }

        this.errorMessage =
          'Unable to retrieve ticket information from the server.';
      },
    });
  }

  /**
   * Applies the API responses to the dashboard properties.
   *
   * @param responses Responses returned by the ticket API.
   */
  private applyTicketStatistics(responses: {
    total: TicketQueryResponse;
    open: TicketQueryResponse;
    inProgress: TicketQueryResponse;
    resolved: TicketQueryResponse;
    closed: TicketQueryResponse;
    recent: TicketQueryResponse;
  }): void {
    /**
     * TotalCount represents the complete result set, not just the
     * records returned on the current page.
     */
    this.totalTickets = responses.total.totalCount;

    this.openTickets = responses.open.totalCount;

    this.inProgressTickets = responses.inProgress.totalCount;

    this.resolvedTickets = responses.resolved.totalCount;

    this.closedTickets = responses.closed.totalCount;

    this.recentTickets = responses.recent.items;
  }

  /**
   * Returns a user-friendly status label.
   *
   * @param status Numeric ticket status.
   * @returns Human-readable status.
   */
  getStatusLabel(status: TicketStatus): string {
    return getTicketStatusLabel(status);
  }

  /**
   * Returns a user-friendly priority label.
   *
   * @param priority Numeric ticket priority.
   * @returns Human-readable priority.
   */
  getPriorityLabel(priority: TicketPriority): string {
    return getTicketPriorityLabel(priority);
  }

  /**
   * Logs the authenticated user out of the application.
   */
  logout(): void {
    this.authService.logout();

    this.router.navigate(['/login']);
  }
}
