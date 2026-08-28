import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs';

import { TicketService } from '../../../core/services/ticket.service';
import { UserService } from '../../../core/services/user.service';

import {
  AddTicketCommentRequest,
  CreateTimeEntryRequest,
  getTicketPriorityLabel,
  getTicketStatusLabel,
  TicketActivityResponse,
  TicketCommentResponse,
  TicketDetailsResponse,
  TicketPriority,
  TicketResponse,
  TicketStatus,
  TicketTimeEntryResponse,
} from '../../../models/ticket.models';

import { UserResponse } from '../../../models/user.models';

/**
 * ============================================================================
 * TicketingSystem - Ticket Detail Component
 * ============================================================================
 *
 * Displays the complete details of a selected support ticket.
 *
 * Responsibilities:
 *
 * - Read the ticket ID from the route.
 * - Load the complete ticket-details envelope.
 * - Extract the actual TicketResponse from response.ticket.
 * - Display comments, activity and time entries.
 * - Add comments to the ticket.
 * - Record work time against the ticket.
 * - Load available support agents.
 * - Assign the ticket to a support agent.
 * - Change ticket workflow status.
 * - Navigate back to the ticket list.
 *
 * Existing ticket functionality is intentionally preserved.
 *
 * API endpoints:
 *
 * GET   /api/Tickets/{id}/details
 * GET   /api/Tickets/{id}
 * POST  /api/Tickets/{id}/comments
 * PATCH /api/Tickets/{id}/assign
 * PATCH /api/Tickets/{id}/status
 * GET   /api/tickets/{ticketId}/time-entries
 * POST  /api/tickets/{ticketId}/time-entries
 * GET   /api/Users/agents
 * ============================================================================
 */
@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss'],
})
export class TicketDetailComponent implements OnInit {
  /**
   * Currently loaded ticket.
   */
  ticket: TicketResponse | null = null;

  /**
   * Complete details response.
   */
  private ticketDetails: TicketDetailsResponse | null = null;

  /**
   * Available support agents.
   */
  agents: UserResponse[] = [];

  /**
   * Selected support-agent identifier.
   */
  selectedAgentId = '';

  /**
   * Selected workflow status.
   */
  selectedStatus: TicketStatus | null = null;

  /**
   * New comment entered by the current user.
   */
  newComment = '';

  /**
   * Indicates that the comment is currently being submitted.
   */
  isAddingComment = false;

  /**
   * Message displayed after a comment operation.
   */
  commentMessage = '';

  /**
   * Work date selected in the Log Time form.
   *
   * HTML date inputs use the YYYY-MM-DD format.
   */
  timeEntryWorkDate = '';

  /**
   * Duration entered in the Log Time form.
   *
   * The UI accepts HH:mm and converts it to HH:mm:ss before sending
   * the request to ASP.NET Core.
   */
  timeEntryDuration = '';

  /**
   * Work description entered in the Log Time form.
   */
  timeEntryDescription = '';

  /**
   * Indicates that a time-entry operation is currently running.
   */
  isAddingTimeEntry = false;

  /**
   * Message displayed after a time-entry operation.
   */
  timeEntryMessage = '';

  /**
   * Indicates that the ticket is loading.
   */
  isLoading = false;

  /**
   * Indicates that the support-agent collection is loading.
   */
  isLoadingAgents = false;

  /**
   * Indicates that an assignment operation is running.
   */
  isAssigning = false;

  /**
   * Indicates that a status update is running.
   */
  isUpdatingStatus = false;

  /**
   * Error displayed when the ticket cannot be loaded.
   */
  errorMessage = '';

  /**
   * Assignment operation message.
   */
  assignmentMessage = '';

  /**
   * Status update message.
   */
  statusMessage = '';

  /**
   * Route ticket identifier.
   */
  private ticketId = 0;

  /**
   * Available workflow statuses.
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
   * Creates an instance of TicketDetailComponent.
   *
   * @param route Activated route containing the ticket identifier.
   * @param router Angular router.
   * @param ticketService Ticket API service.
   * @param userService User-management API service.
   */
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly ticketService: TicketService,
    private readonly userService: UserService,
  ) {}

  /**
   * Initializes the ticket-detail page.
   */
  ngOnInit(): void {
    this.initializeTimeEntryForm();
    this.loadTicketFromRoute();
    this.loadAgents();
  }

  /**
   * Initializes the Log Time form with sensible defaults.
   */
  private initializeTimeEntryForm(): void {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    this.timeEntryWorkDate = `${year}-${month}-${day}`;
    this.timeEntryDuration = '';
    this.timeEntryDescription = '';
  }

  /**
   * Reads and validates the ticket identifier from the URL.
   */
  private loadTicketFromRoute(): void {
    const rawId = this.route.snapshot.paramMap.get('id');

    const parsedId = Number(rawId);

    if (!rawId || !Number.isInteger(parsedId) || parsedId <= 0) {
      this.errorMessage = 'The ticket identifier is invalid.';
      return;
    }

    this.ticketId = parsedId;

    this.loadTicket();
  }

  /**
   * Loads the complete ticket details.
   */
  loadTicket(): void {
    if (!this.ticketId) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.assignmentMessage = '';
    this.statusMessage = '';
    this.commentMessage = '';

    this.ticketService
      .getTicketDetails(this.ticketId)
      .pipe(
        catchError(() =>
          this.ticketService.getTicket(this.ticketId).pipe(
            catchError((error) => {
              throw error;
            }),
          ),
        ),
      )
      .subscribe({
        next: (response: TicketDetailsResponse | TicketResponse) => {
          if (this.isTicketDetailsResponse(response)) {
            this.ticketDetails = response;
            this.ticket = response.ticket;

            this.selectedAgentId = response.ticket.assignedAgentId ?? '';

            this.selectedStatus = response.ticket.status;
          } else {
            this.ticketDetails = null;
            this.ticket = response;

            this.selectedAgentId = response.assignedAgentId ?? '';

            this.selectedStatus = response.status;
          }

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
            this.errorMessage =
              'Your session has expired. Please sign in again.';
            return;
          }

          if (error.status === 403) {
            this.errorMessage =
              'You do not have permission to view this ticket.';
            return;
          }

          if (error.status === 404) {
            this.errorMessage = 'The requested ticket could not be found.';
            return;
          }

          this.errorMessage =
            error.error?.detail ??
            error.error?.message ??
            error.error?.title ??
            'Unable to load the requested ticket.';
        },
      });
  }

  /**
   * Determines whether the API response is a TicketDetailsResponse.
   *
   * @param response API response.
   * @returns True when the response contains a ticket property.
   */
  private isTicketDetailsResponse(
    response: TicketDetailsResponse | TicketResponse,
  ): response is TicketDetailsResponse {
    return (
      response !== null && typeof response === 'object' && 'ticket' in response
    );
  }

  /**
   * Adds the comment currently entered in the comment composer.
   *
   * The authenticated backend user is automatically recorded as the
   * comment author.
   */
  addComment(): void {
    if (!this.ticket || this.isAddingComment) {
      return;
    }

    const content = this.newComment.trim();

    if (!content) {
      this.commentMessage = 'Please enter a comment before submitting.';
      return;
    }

    const ticketId = this.ticket.id;

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      this.commentMessage =
        'The ticket identifier is invalid. Please reload the page.';
      return;
    }

    const request: AddTicketCommentRequest = {
      content,
    };

    this.isAddingComment = true;
    this.commentMessage = '';

    this.ticketService.addComment(ticketId, request).subscribe({
      next: (comment: TicketCommentResponse) => {
        if (this.ticketDetails) {
          this.ticketDetails = {
            ...this.ticketDetails,
            comments: [...this.ticketDetails.comments, comment],
          };
        }

        this.newComment = '';
        this.commentMessage = 'Comment added successfully.';
        this.isAddingComment = false;
      },

      error: (error: {
        status?: number;
        error?: {
          title?: string;
          detail?: string;
          message?: string;
        };
      }) => {
        if (error.status === 400) {
          this.commentMessage =
            error.error?.detail ??
            error.error?.message ??
            error.error?.title ??
            'The comment could not be added.';
        } else if (error.status === 401) {
          this.commentMessage =
            'Your session has expired. Please sign in again.';
        } else if (error.status === 403) {
          this.commentMessage =
            'You do not have permission to comment on this ticket.';
        } else if (error.status === 404) {
          this.commentMessage = 'The requested ticket could not be found.';
        } else {
          this.commentMessage =
            error.error?.detail ??
            error.error?.message ??
            error.error?.title ??
            'Unable to add the comment. Please try again.';
        }

        this.isAddingComment = false;
      },
    });
  }

  /**
   * Records work performed against the currently loaded ticket.
   *
   * The backend expects a .NET TimeSpan. The UI accepts HH:mm and this
   * method converts it to HH:mm:ss before submitting the request.
   */
  addTimeEntry(): void {
    if (!this.ticket || this.isAddingTimeEntry) {
      return;
    }

    const ticketId = this.ticket.id;

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      this.timeEntryMessage =
        'The ticket identifier is invalid. Please reload the page.';
      return;
    }

    const workDate = this.timeEntryWorkDate.trim();
    const duration = this.timeEntryDuration.trim();
    const description = this.timeEntryDescription.trim();

    if (!workDate) {
      this.timeEntryMessage = 'Please select the date when the work was done.';
      return;
    }

    if (!duration) {
      this.timeEntryMessage = 'Please enter the amount of time worked.';
      return;
    }

    if (!this.isValidDuration(duration)) {
      this.timeEntryMessage = 'Enter a valid duration between 00:01 and 24:00.';
      return;
    }

    if (!description) {
      this.timeEntryMessage = 'Please describe the work performed.';
      return;
    }

    if (description.length > 2000) {
      this.timeEntryMessage =
        'The work description cannot exceed 2000 characters.';
      return;
    }

    const request: CreateTimeEntryRequest = {
      workDate,
      duration: this.toApiDuration(duration),
      description,
    };

    this.isAddingTimeEntry = true;
    this.timeEntryMessage = '';

    this.ticketService.createTimeEntry(ticketId, request).subscribe({
      next: (entry: TicketTimeEntryResponse) => {
        if (this.ticketDetails) {
          this.ticketDetails = {
            ...this.ticketDetails,
            timeEntries: [...this.ticketDetails.timeEntries, entry],
          };
        }

        this.timeEntryWorkDate = this.getTodayDate();
        this.timeEntryDuration = '';
        this.timeEntryDescription = '';

        this.timeEntryMessage = 'Work time recorded successfully.';
        this.isAddingTimeEntry = false;

        /**
         * The CreateTimeEntry API response does not contain the recalculated
         * ticket TotalWorkTime. Reloading the ticket details ensures that
         * the summary and total work time remain synchronized with the
         * database after the new entry has been persisted.
         */
        this.refreshTicketDetailsAfterTimeEntry();
      },

      error: (error: {
        status?: number;
        error?: {
          title?: string;
          detail?: string;
          message?: string;
        };
      }) => {
        if (error.status === 400) {
          this.timeEntryMessage =
            error.error?.detail ??
            error.error?.message ??
            error.error?.title ??
            'The work entry could not be recorded.';
        } else if (error.status === 401) {
          this.timeEntryMessage =
            'Your session has expired. Please sign in again.';
        } else if (error.status === 403) {
          this.timeEntryMessage =
            'You do not have permission to record work against this ticket.';
        } else if (error.status === 404) {
          this.timeEntryMessage = 'The requested ticket could not be found.';
        } else {
          this.timeEntryMessage =
            error.error?.detail ??
            error.error?.message ??
            error.error?.title ??
            'Unable to record work time. Please try again.';
        }

        this.isAddingTimeEntry = false;
      },
    });
  }

  /**
   * Refreshes the ticket details after recording work.
   *
   * This keeps the total work-time summary and activity timeline
   * synchronized with the backend.
   */
  private refreshTicketDetailsAfterTimeEntry(): void {
    if (!this.ticketId) {
      return;
    }

    this.ticketService.getTicketDetails(this.ticketId).subscribe({
      next: (response: TicketDetailsResponse) => {
        this.ticketDetails = response;
        this.ticket = response.ticket;

        this.selectedAgentId = response.ticket.assignedAgentId ?? '';
        this.selectedStatus = response.ticket.status;

        this.isAddingTimeEntry = false;
        this.timeEntryMessage = 'Work time recorded successfully.';
      },

      error: () => {
        /**
         * The original POST already succeeded. Therefore a refresh failure
         * must not turn the successful work-entry operation into an error.
         *
         * The newly created entry has already been added locally above.
         */
        this.isAddingTimeEntry = false;
        this.timeEntryMessage = 'Work time recorded successfully.';
      },
    });
  }

  /**
   * Validates a duration entered as HH:mm.
   *
   * Supported range:
   *
   * - 00:01
   * - through 24:00
   *
   * @param duration Duration entered by the user.
   * @returns True when the duration is valid.
   */
  private isValidDuration(duration: string): boolean {
    const match = /^(\d{1,2}):([0-5]\d)$/.exec(duration);

    if (!match) {
      return false;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
      return false;
    }

    if (hours < 0 || hours > 24) {
      return false;
    }

    if (hours === 24 && minutes !== 0) {
      return false;
    }

    return hours > 0 || minutes > 0;
  }

  /**
   * Converts a frontend HH:mm duration into the HH:mm:ss format expected
   * by the ASP.NET Core TimeSpan JSON converter.
   *
   * @param duration Frontend duration.
   * @returns API-compatible duration.
   */
  private toApiDuration(duration: string): string {
    const parts = duration.split(':');

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}:00`;
  }

  /**
   * Gets today's local date in the format required by an HTML date input.
   *
   * @returns Current local date in YYYY-MM-DD format.
   */
  private getTodayDate(): string {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Loads the available support agents.
   */
  loadAgents(): void {
    this.isLoadingAgents = true;

    this.userService.getAgents().subscribe({
      next: (agents: UserResponse[]) => {
        this.agents = agents ?? [];
        this.isLoadingAgents = false;
      },

      error: () => {
        this.agents = [];
        this.isLoadingAgents = false;
      },
    });
  }

  /**
   * Assigns the ticket to the selected support agent.
   */
  assignTicket(): void {
    if (!this.ticket || !this.selectedAgentId) {
      return;
    }

    const ticketId = this.ticket.id;
    const agentId = this.selectedAgentId;

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      this.assignmentMessage =
        'The ticket identifier is invalid. Please reload the page.';
      return;
    }

    this.isAssigning = true;
    this.assignmentMessage = '';

    this.ticketService
      .assignTicket(ticketId, {
        agentId,
      })
      .subscribe({
        next: (updatedTicket) => {
          this.ticket = {
            ...this.ticket!,
            ...updatedTicket,
          };

          this.selectedAgentId = updatedTicket.assignedAgentId ?? agentId;

          this.assignmentMessage = 'Ticket assignment updated successfully.';

          this.isAssigning = false;
        },

        error: (error: {
          status?: number;
          error?: {
            title?: string;
            detail?: string;
            message?: string;
          };
        }) => {
          if (error.status === 400) {
            this.assignmentMessage =
              error.error?.detail ??
              error.error?.message ??
              error.error?.title ??
              'The selected support agent could not be assigned to this ticket.';
          } else if (error.status === 404) {
            this.assignmentMessage =
              'The ticket or selected support agent could not be found.';
          } else if (error.status === 403) {
            this.assignmentMessage =
              'You do not have permission to assign this ticket.';
          } else {
            this.assignmentMessage =
              error.error?.detail ??
              error.error?.message ??
              error.error?.title ??
              'Unable to assign the ticket. Please try again.';
          }

          this.isAssigning = false;
        },
      });
  }

  /**
   * Changes the ticket workflow status.
   */
  updateStatus(): void {
    if (!this.ticket || this.selectedStatus === null) {
      return;
    }

    if (this.selectedStatus === this.ticket.status) {
      return;
    }

    const ticketId = this.ticket.id;
    const newStatus = this.selectedStatus;

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      this.statusMessage =
        'The ticket identifier is invalid. Please reload the page.';
      return;
    }

    this.isUpdatingStatus = true;
    this.statusMessage = '';

    this.ticketService
      .updateTicketStatus(ticketId, {
        status: newStatus,
      })
      .subscribe({
        next: (updatedTicket) => {
          this.ticket = {
            ...this.ticket!,
            ...updatedTicket,
          };

          this.selectedStatus = updatedTicket.status;

          this.statusMessage = 'Ticket status updated successfully.';

          this.isUpdatingStatus = false;
        },

        error: (error: {
          status?: number;
          error?: {
            title?: string;
            detail?: string;
            message?: string;
          };
        }) => {
          this.statusMessage =
            error.error?.detail ??
            error.error?.message ??
            error.error?.title ??
            'Unable to update the ticket status. Please try again.';

          this.isUpdatingStatus = false;
        },
      });
  }

  /**
   * Navigates back to the ticket list.
   */
  goBack(): void {
    this.router.navigate(['/tickets']);
  }

  /**
   * Converts a status to a display label.
   *
   * @param status Ticket status.
   * @returns Display label.
   */
  getStatusLabel(status: TicketStatus): string {
    return getTicketStatusLabel(status);
  }

  /**
   * Converts a priority to a display label.
   *
   * @param priority Ticket priority.
   * @returns Display label.
   */
  getPriorityLabel(priority: TicketPriority): string {
    return getTicketPriorityLabel(priority);
  }

  /**
   * Gets a CSS class for a ticket status.
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
   * Gets a CSS class for a ticket priority.
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
   * Formats an API date.
   *
   * @param value ISO date-time.
   * @returns Formatted date.
   */
  formatDate(value?: string): string {
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
   * Formats a work date without introducing an unwanted timezone shift.
   *
   * @param value Work date returned by the API.
   * @returns Formatted work date.
   */
  formatWorkDate(value?: string): string {
    if (!value) {
      return '-';
    }

    const datePart = value.substring(0, 10);

    const parts = datePart.split('-');

    if (parts.length !== 3) {
      return this.formatDate(value);
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day)
    ) {
      return value;
    }

    const date = new Date(year, month - 1, day);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  /**
   * Formats a TimeSpan value.
   *
   * Supports:
   *
   * - HH:mm:ss
   * - d.HH:mm:ss
   * - HH:mm
   *
   * @param value TimeSpan string.
   * @returns Compact duration.
   */
  formatWorkTime(value?: string): string {
    if (!value) {
      return '0m';
    }

    const parts = value.split(':');

    if (parts.length !== 3 && parts.length !== 2) {
      return value;
    }

    let hoursPart = parts[0];
    const minutesPart = parts[1];

    let days = 0;
    let hours = 0;
    let minutes = Number(minutesPart) || 0;

    if (hoursPart.includes('.')) {
      const dayParts = hoursPart.split('.');

      days = Number(dayParts[0]) || 0;
      hours = Number(dayParts[1]) || 0;
    } else {
      hours = Number(hoursPart) || 0;
    }

    const result: string[] = [];

    if (days > 0) {
      result.push(`${days}d`);
    }

    if (hours > 0) {
      result.push(`${hours}h`);
    }

    if (minutes > 0) {
      result.push(`${minutes}m`);
    }

    return result.length > 0 ? result.join(' ') : '0m';
  }

  /**
   * Gets the comments supplied by the details endpoint.
   *
   * @returns Ticket comments.
   */
  get comments(): TicketCommentResponse[] {
    return this.ticketDetails?.comments ?? [];
  }

  /**
   * Gets the activity entries supplied by the details endpoint.
   *
   * @returns Ticket activities.
   */
  get activities(): TicketActivityResponse[] {
    return this.ticketDetails?.activities ?? [];
  }

  /**
   * Gets the recorded time entries.
   *
   * @returns Ticket time entries.
   */
  get timeEntries(): TicketTimeEntryResponse[] {
    return this.ticketDetails?.timeEntries ?? [];
  }

  /**
   * Returns the display name for an agent.
   *
   * @param agent Agent.
   * @returns Agent name.
   */
  getAgentName(agent: UserResponse): string {
    return `${agent.firstName} ${agent.lastName}`.trim();
  }

  /**
   * Returns the first letter of an agent's name.
   *
   * @param agent Agent.
   * @returns Agent initial.
   */
  getAgentInitial(agent: UserResponse): string {
    return this.getAgentName(agent).charAt(0).toUpperCase();
  }
}
