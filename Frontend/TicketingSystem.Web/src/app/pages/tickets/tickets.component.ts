import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  getTicketPriorityLabel,
  getTicketStatusLabel,
  TicketPriority,
  TicketQueryRequest,
  TicketResponse,
  TicketStatus,
} from '../../models/ticket.models';

import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * ============================================================================
 * TicketingSystem - Tickets Page Component
 * ============================================================================
 *
 * Provides the main ticket-management screen.
 *
 * Responsibilities:
 *
 * - Load tickets.
 * - Search tickets.
 * - Filter tickets.
 * - Sort tickets.
 * - Paginate tickets.
 * - Display ticket information.
 * - Navigate to ticket details.
 * - Provide an obvious interactive visual treatment for ticket rows.
 * - Control ticket creation according to the authenticated user's role.
 *
 * ROLE-BASED CREATE PERMISSION:
 *
 * Customer:
 * - Can create tickets.
 *
 * Support Agent:
 * - Cannot create tickets.
 *
 * Admin:
 * - Can create tickets.
 *
 * IMPORTANT:
 *
 * This role check controls the user interface only.
 *
 * The backend remains the authoritative security boundary and must continue
 * enforcing ticket-creation authorization independently.
 * ============================================================================
 */
@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss'],
})
export class TicketsComponent implements OnInit {
  /**
   * Tickets displayed on the current page.
   */
  tickets: TicketResponse[] = [];

  /**
   * Indicates whether tickets are currently loading.
   */
  isLoading = false;

  /**
   * API error message.
   */
  errorMessage = '';

  /**
   * Total number of matching tickets.
   */
  totalCount = 0;

  /**
   * Current page.
   */
  pageNumber = 1;

  /**
   * Page size.
   */
  pageSize = 20;

  /**
   * Total available pages.
   */
  totalPages = 0;

  /**
   * Current search text.
   */
  search = '';

  /**
   * Selected status filter.
   */
  selectedStatus: TicketStatus | null = null;

  /**
   * Selected priority filter.
   */
  selectedPriority: TicketPriority | null = null;

  /**
   * Current sort property.
   */
  sortBy = 'CreatedAt';

  /**
   * Indicates descending sorting.
   */
  sortDescending = true;

  /**
   * Available status filters.
   */
  readonly ticketStatuses = [
    {
      value: TicketStatus.Open,
      label: getTicketStatusLabel(TicketStatus.Open),
    },
    {
      value: TicketStatus.InProgress,
      label: getTicketStatusLabel(TicketStatus.InProgress),
    },
    {
      value: TicketStatus.Resolved,
      label: getTicketStatusLabel(TicketStatus.Resolved),
    },
    {
      value: TicketStatus.Closed,
      label: getTicketStatusLabel(TicketStatus.Closed),
    },
  ];

  /**
   * Available priority filters.
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
   * Creates the TicketsComponent.
   *
   * @param ticketService Ticket API service.
   * @param authService Authentication service used for role-aware UI
   *                    permissions.
   * @param router Angular router.
   */
  constructor(
    private readonly ticketService: TicketService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  /**
   * Indicates whether the current authenticated user can create a ticket.
   *
   * Administrators and customers can create tickets.
   *
   * Support Agents cannot create tickets.
   *
   * @returns True when the Create Ticket action should be displayed.
   */
  get canCreateTicket(): boolean {
    const currentUser = this.authService.getStoredCurrentUser();

    const role = currentUser?.role?.trim().toLowerCase();

    return role === 'admin' || role === 'customer';
  }

  /**
   * Loads tickets when the page is initialized.
   */
  ngOnInit(): void {
    this.loadTickets();
  }

  /**
   * Loads tickets using the current search/filter/sort state.
   */
  loadTickets(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const request: TicketQueryRequest = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      search: this.search.trim() || undefined,
      status: this.selectedStatus ?? undefined,
      priority: this.selectedPriority ?? undefined,
      sortBy: this.sortBy,
      sortDescending: this.sortDescending,
    };

    this.ticketService.getTickets(request).subscribe({
      next: (response) => {
        this.tickets = response.items ?? [];
        this.totalCount = response.totalCount ?? 0;
        this.pageNumber = response.pageNumber ?? this.pageNumber;
        this.pageSize = response.pageSize ?? this.pageSize;
        this.totalPages = response.totalPages ?? 0;
        this.isLoading = false;
      },

      error: (error: {
        status?: number;
        error?: {
          title?: string;
          detail?: string;
          message?: string;
        };
      }) => {
        this.isLoading = false;

        if (error.status === 401) {
          this.errorMessage = 'Your session has expired. Please sign in again.';
          return;
        }

        if (error.status === 403) {
          this.errorMessage =
            'You do not have permission to view these tickets.';
          return;
        }

        this.errorMessage =
          error.error?.detail ??
          error.error?.message ??
          error.error?.title ??
          'Unable to load tickets. Please try again.';
      },
    });
  }

  /**
   * Applies the currently selected filters.
   */
  applyFilters(): void {
    this.pageNumber = 1;
    this.loadTickets();
  }

  /**
   * Clears all ticket filters.
   */
  clearFilters(): void {
    this.search = '';
    this.selectedStatus = null;
    this.selectedPriority = null;
    this.pageNumber = 1;

    this.loadTickets();
  }

  /**
   * Changes the ticket sorting property.
   *
   * @param sortBy Backend sorting property.
   */
  changeSort(sortBy: string): void {
    if (!sortBy) {
      return;
    }

    this.sortBy = sortBy;
    this.pageNumber = 1;
    this.loadTickets();
  }

  /**
   * Toggles the sorting direction.
   */
  toggleSortDirection(): void {
    this.sortDescending = !this.sortDescending;
    this.pageNumber = 1;
    this.loadTickets();
  }

  /**
   * Navigates to a ticket's detail screen.
   *
   * This method intentionally uses the ticket ID returned by the API
   * rather than attempting to construct or reinterpret the identifier.
   *
   * @param ticket Ticket selected by the user.
   */
  openTicket(ticket: TicketResponse): void {
    if (!ticket || !Number.isFinite(ticket.id) || ticket.id <= 0) {
      return;
    }

    this.router.navigate(['/tickets', ticket.id]);
  }

  /**
   * Navigates to a specific pagination page.
   *
   * @param page Target page number.
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.pageNumber) {
      return;
    }

    this.pageNumber = page;
    this.loadTickets();
  }

  /**
   * Indicates whether a previous page exists.
   */
  get canGoPrevious(): boolean {
    return this.pageNumber > 1;
  }

  /**
   * Indicates whether a next page exists.
   */
  get canGoNext(): boolean {
    return this.pageNumber < this.totalPages;
  }

  /**
   * Gets the first displayed result number.
   */
  get firstResultNumber(): number {
    if (this.totalCount === 0) {
      return 0;
    }

    return (this.pageNumber - 1) * this.pageSize + 1;
  }

  /**
   * Gets the last displayed result number.
   */
  get lastResultNumber(): number {
    if (this.totalCount === 0) {
      return 0;
    }

    return Math.min(this.pageNumber * this.pageSize, this.totalCount);
  }

  /**
   * Gets the visible pagination page numbers.
   */
  get visiblePages(): number[] {
    if (this.totalPages <= 0) {
      return [];
    }

    if (this.totalPages <= 5) {
      return Array.from({ length: this.totalPages }, (_, index) => index + 1);
    }

    let startPage = Math.max(1, this.pageNumber - 2);

    let endPage = Math.min(this.totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    return Array.from(
      {
        length: endPage - startPage + 1,
      },
      (_, index) => startPage + index,
    );
  }

  /**
   * Navigates to the ticket creation page.
   *
   * The method contains a defensive authorization check in addition to
   * hiding the button in the template and protecting the route.
   */
  createTicket(): void {
    if (!this.canCreateTicket) {
      return;
    }

    this.router.navigate(['/tickets/create']);
  }

  /**
   * Converts a status into a display label.
   *
   * @param status Ticket status.
   * @returns Display label.
   */
  getStatusLabel(status: TicketStatus): string {
    return getTicketStatusLabel(status);
  }

  /**
   * Converts a priority into a display label.
   *
   * @param priority Ticket priority.
   * @returns Display label.
   */
  getPriorityLabel(priority: TicketPriority): string {
    return getTicketPriorityLabel(priority);
  }

  /**
   * Gets the CSS class for a ticket status.
   *
   * @param status Ticket status.
   * @returns CSS class.
   */
  getStatusClass(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.Open:
        return 'status-open';

      case TicketStatus.InProgress:
        return 'status-progress';

      case TicketStatus.Resolved:
        return 'status-resolved';

      case TicketStatus.Closed:
        return 'status-closed';

      default:
        return '';
    }
  }

  /**
   * Gets the CSS class for a ticket priority.
   *
   * @param priority Ticket priority.
   * @returns CSS class.
   */
  getPriorityClass(priority: TicketPriority): string {
    switch (priority) {
      case TicketPriority.Low:
        return 'priority-low';

      case TicketPriority.Medium:
        return 'priority-medium';

      case TicketPriority.High:
        return 'priority-high';

      case TicketPriority.Critical:
        return 'priority-critical';

      default:
        return '';
    }
  }

  /**
   * Formats an API date-time.
   *
   * @param value ISO date-time value.
   * @returns Formatted date-time.
   */
  formatDate(value: string): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  /**
   * Converts a backend TimeSpan into a compact display value.
   *
   * @param value Backend TimeSpan.
   * @returns Human-readable duration.
   */
  formatWorkTime(value: string): string {
    if (!value) {
      return '0m';
    }

    const parts = value.split(':');

    if (parts.length !== 3) {
      return value;
    }

    const hoursPart = parts[0];
    const minutesPart = parts[1];

    let days = 0;
    let hours = 0;
    let minutes = 0;

    if (hoursPart.includes('.')) {
      const dayParts = hoursPart.split('.');

      days = Number(dayParts[0]) || 0;
      hours = Number(dayParts[1]) || 0;
    } else {
      hours = Number(hoursPart) || 0;
    }

    minutes = Number(minutesPart) || 0;

    const formattedParts: string[] = [];

    if (days > 0) {
      formattedParts.push(`${days}d`);
    }

    if (hours > 0) {
      formattedParts.push(`${hours}h`);
    }

    if (minutes > 0) {
      formattedParts.push(`${minutes}m`);
    }

    return formattedParts.length > 0 ? formattedParts.join(' ') : '0m';
  }
}
