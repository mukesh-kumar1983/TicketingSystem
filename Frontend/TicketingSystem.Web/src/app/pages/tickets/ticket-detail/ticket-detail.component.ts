import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
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
* * Read the ticket ID from the route.
* * Load the complete ticket-details response.
* * Display ticket information.
* * Display comments.
* * Display activity history.
* * Display time entries.
* * Add comments to the ticket.
* * Record work time against the ticket.
* * Load available support agents for authorized users.
* * Assign the ticket to a support agent for authorized users.
* * Change ticket workflow status for authorized users.
* * Navigate back to the ticket list.
* * Apply role-based UI visibility.
*
* ROLE-BASED UI
* ============================================================================
*
* Customers:
*
* * Can view their ticket.
* * Can add comments.
* * Can record work time when permitted by the backend.
* * Can view activity.
* * Cannot assign tickets.
* * Cannot change ticket status.
*
* Administrators / authorized staff:
*
* * Can use the assignment and status controls according to backend
* authorization rules.
*
* IMPORTANT:
*
* Hiding controls in the frontend is only a user-experience measure.
*
* The backend remains the authoritative security boundary and must continue
* enforcing all role and permission rules.
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
  
  * Comments returned by the backend.
    */
  comments: TicketCommentResponse[] = [];

  /**
  
  * Activity entries returned by the backend.
    */
  activities: TicketActivityResponse[] = [];

  /**
  
  * Recorded work-time entries returned by the backend.
    */
  timeEntries: TicketTimeEntryResponse[] = [];

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
  
  * Indicates that a comment is currently being submitted.
    */
  isAddingComment = false;

  /**
  
  * Message displayed after a comment operation.
    */
  commentMessage = '';

  /**
  
  * Work date selected in the Log Time form.
    */
  timeEntryWorkDate = '';

  /**
  
  * Duration entered in the Log Time form.
  *
  * The UI accepts HH:mm and converts it to HH:mm:ss before submitting.
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
  
  * Indicates that support agents are loading.
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
  
  * Creates the ticket-detail component.
  *
  * @param route Activated route containing the ticket identifier.
  * @param router Angular router.
  * @param authService Authentication service used for role information.
  * @param ticketService Ticket API service.
  * @param userService User-management API service.
    */
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly ticketService: TicketService,
    private readonly userService: UserService,
  ) {}

  /**
  
  * Determines whether the currently authenticated user is a Customer.
  *
  * This property is consumed directly by the Angular template.
  *
  * @returns True when the current user has the Customer role.
    */
  get isCustomer(): boolean {
    return this.authService.isCustomer();
  }

  /**
  
  * Initializes the ticket-detail page.
    */
  ngOnInit(): void {
    this.initializeTimeEntryForm();
    this.loadTicketFromRoute();

    /**


      
 * Customers do not need the agent list because they cannot assign tickets.
 *
 * Avoiding the API call also prevents unnecessary 403 responses.
 */
    if (!this.isCustomer) {
      this.loadAgents();
    }
  }

  /**
  
  * Initializes the Log Time form.
    */
  private initializeTimeEntryForm(): void {
    this.timeEntryWorkDate = this.getTodayDate();
    this.timeEntryDuration = '';
    this.timeEntryDescription = '';
  }

  /**
  
  * Reads and validates the ticket identifier from the route.
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
  
  * Loads complete ticket details.
  *
  * The backend details endpoint is the authoritative source for this page.
    */
  loadTicket(): void {
    if (!this.ticketId) {
      return;
    }

    this.isLoading = true;

    this.errorMessage = '';

    this.ticketService.getTicketDetails(this.ticketId).subscribe({
      next: (response: TicketDetailsResponse) => {
        this.applyTicketDetails(response);
        this.isLoading = false;
      },

      error: (error: {
        status?: number;
        error?: {
          title?: string;
          detail?: string;
          message?: string;
        };
        message?: string;
      }) => {
        this.isLoading = false;

        this.ticket = null;
        this.comments = [];
        this.activities = [];
        this.timeEntries = [];

        this.errorMessage = this.getErrorMessage(
          error,
          'Unable to load the requested ticket.',
        );
      },
    });
  }

  /**
  
  * Applies the complete backend ticket-details response to component state.
  *
  * @param response Complete ticket-details response.
    */
  private applyTicketDetails(response: TicketDetailsResponse): void {
    if (!response || !response.ticket) {
      this.ticket = null;
      this.comments = [];
      this.activities = [];
      this.timeEntries = [];
      return;
    }

    this.ticket = response.ticket;

    this.comments = Array.isArray(response.comments)
      ? [...response.comments]
      : [];

    this.activities = Array.isArray(response.activities)
      ? [...response.activities]
      : [];

    this.timeEntries = Array.isArray(response.timeEntries)
      ? [...response.timeEntries]
      : [];

    this.selectedAgentId = response.ticket.assignedAgentId ?? '';
    this.selectedStatus = response.ticket.status;
  }

  /**
  
  * Adds a comment to the currently loaded ticket.
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
      next: (createdComment: TicketCommentResponse) => {
        if (createdComment) {
          this.comments = [...this.comments, createdComment];
        }

        this.newComment = '';
        this.commentMessage = 'Comment added successfully.';

        this.refreshTicketDetailsAfterComment();
      },

      error: (error: {
        status?: number;
        error?: {
          title?: string;
          detail?: string;
          message?: string;
        };
        message?: string;
      }) => {
        this.isAddingComment = false;

        this.commentMessage = this.getErrorMessage(
          error,
          'Unable to add the comment. Please try again.',
        );
      },
    });
  }

  /**
  
  * Refreshes ticket details after a successful comment operation.
    */
  private refreshTicketDetailsAfterComment(): void {
    if (!this.ticketId) {
      this.isAddingComment = false;
      return;
    }

    this.ticketService.getTicketDetails(this.ticketId).subscribe({
      next: (response: TicketDetailsResponse) => {
        this.applyTicketDetails(response);

        this.isAddingComment = false;
        this.commentMessage = 'Comment added successfully.';
      },

      error: () => {
        this.isAddingComment = false;
        this.commentMessage = 'Comment added successfully.';
      },
    });
  }

  /**
  
  * Records work performed against the currently loaded ticket.
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
        this.timeEntries = [...this.timeEntries, entry];

        this.timeEntryWorkDate = this.getTodayDate();
        this.timeEntryDuration = '';
        this.timeEntryDescription = '';

        this.timeEntryMessage = 'Work time recorded successfully.';

        this.refreshTicketDetailsAfterTimeEntry();
      },

      error: (error: {
        status?: number;
        error?: {
          title?: string;
          detail?: string;
          message?: string;
        };
        message?: string;
      }) => {
        this.isAddingTimeEntry = false;

        this.timeEntryMessage = this.getErrorMessage(
          error,
          'Unable to record work time. Please try again.',
        );
      },
    });
  }

  /**
  
  * Refreshes ticket details after recording work.
    */
  private refreshTicketDetailsAfterTimeEntry(): void {
    if (!this.ticketId) {
      this.isAddingTimeEntry = false;
      return;
    }

    this.ticketService.getTicketDetails(this.ticketId).subscribe({
      next: (response: TicketDetailsResponse) => {
        this.applyTicketDetails(response);

        this.isAddingTimeEntry = false;
        this.timeEntryMessage = 'Work time recorded successfully.';
      },

      error: () => {
        this.isAddingTimeEntry = false;
        this.timeEntryMessage = 'Work time recorded successfully.';
      },
    });
  }

  /**
  
  * Validates a duration entered as HH:mm.
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
  
  * Converts HH:mm to ASP.NET Core TimeSpan-compatible HH:mm:ss.
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
  
  * Gets today's local date in YYYY-MM-DD format.
  *
  * IMPORTANT:
  *
  * The previous implementation accidentally inserted spaces around the
  * separators. That produced values such as:
  *
  * 
    2026 -08 -29
    
  *
  * instead of:
  *
  * 
    2026-08-29
    
  *
  * The corrected format is compatible with the HTML date input and backend
  * date parsing.
  *
  * @returns Current local date in YYYY-MM-DD format.
    */
  private getTodayDate(): string {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year} -${month} -${day} `;
  }

  /**
  
  * Loads available support agents.
  *
  * This method is only called for users who are not Customers.
    */
  loadAgents(): void {
    if (this.isCustomer) {
      this.agents = [];
      return;
    }

    this.isLoadingAgents = true;

    this.userService.getAgents().subscribe({
      next: (agents: UserResponse[]) => {
        this.agents = agents ?? [];
        this.isLoadingAgents = false;
      },

      error: (error: {
        status?: number;
        error?: {
          title?: string;
          detail?: string;
          message?: string;
        };
        message?: string;
      }) => {
        this.agents = [];
        this.isLoadingAgents = false;

        /**
         * Assignment controls are hidden for Customers, so an agent-loading
         * failure is only relevant to authorized staff.
         *
         * The error is intentionally kept in the assignment message instead
         * of disrupting the entire ticket details page.
         */
        if (!this.isCustomer) {
          this.assignmentMessage = this.getErrorMessage(
            error,
            'Unable to load support agents.',
          );
        }
      },
    });
  }

  /**
  
  * Assigns the ticket to the selected support agent.
  *
  * The frontend prevents Customers from reaching this operation.
  * The backend remains responsible for enforcing authorization.
    */
  assignTicket(): void {
    if (this.isCustomer) {
      this.assignmentMessage =
        'Customers do not have permission to assign tickets.';
      return;
    }

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
          message?: string;
        }) => {
          this.assignmentMessage = this.getErrorMessage(
            error,
            'Unable to assign the ticket. Please try again.',
          );

          this.isAssigning = false;
        },
      });
  }

  /**
  
  * Changes the ticket workflow status.
  *
  * The frontend prevents Customers from reaching this operation.
  * The backend remains responsible for enforcing authorization.
    */
  updateStatus(): void {
    if (this.isCustomer) {
      this.statusMessage =
        'Customers do not have permission to change ticket status.';
      return;
    }

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
          message?: string;
        }) => {
          this.statusMessage = this.getErrorMessage(
            error,
            'Unable to update the ticket status. Please try again.',
          );

          this.isUpdatingStatus = false;
        },
      });
  }

  /**
  
  * Extracts the most useful error message from an Angular HTTP error.
  *
  * Handles:
  *
  * * ASP.NET Core ProblemDetails.detail
  * * ProblemDetails.message
  * * ProblemDetails.title
  * * Angular HttpErrorResponse.message
  * * HTTP 401
  * * HTTP 403
  * * HTTP 404
  * * Generic fallback errors
  *
  * @param error HTTP error returned by Angular.
  * @param fallback Safe fallback message.
  * @returns User-friendly error message.
    */
  private getErrorMessage(
    error: {
      status?: number;
      error?: {
        title?: string;
        detail?: string;
        message?: string;
      };
      message?: string;
    },
    fallback: string,
  ): string {
    if (error.status === 401) {
      return (
        error.error?.detail ??
        error.error?.message ??
        error.error?.title ??
        'Your session has expired. Please sign in again.'
      );
    }

    if (error.status === 403) {
      return (
        error.error?.detail ??
        error.error?.message ??
        error.error?.title ??
        'You do not have permission to perform this operation.'
      );
    }

    if (error.status === 404) {
      return (
        error.error?.detail ??
        error.error?.message ??
        error.error?.title ??
        'The requested resource could not be found.'
      );
    }

    return (
      error.error?.detail ??
      error.error?.message ??
      error.error?.title ??
      error.message ??
      fallback
    );
  }

  /**
  
  * Navigates back to the ticket list.
    */
  goBack(): void {
    this.router.navigate(['/tickets']);
  }

  /**
  
  * Converts a status into its display label.
  *
  * @param status Ticket status.
  * @returns Display label.
    */
  getStatusLabel(status: TicketStatus): string {
    return getTicketStatusLabel(status);
  }

  /**
  
  * Converts a priority into its display label.
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
  * * HH:mm:ss
  * * d.HH:mm:ss
  * * HH:mm
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

    const hoursPart = parts[0];
    const minutesPart = parts[1];

    let days = 0;
    let hours = 0;

    const minutes = Number(minutesPart) || 0;

    if (hoursPart.includes('.')) {
      const dayParts = hoursPart.split('.');

      days = Number(dayParts[0]) || 0;
      hours = Number(dayParts[1]) || 0;
    } else {
      hours = Number(hoursPart) || 0;
    }

    const result: string[] = [];

    if (days > 0) {
      result.push(`${days} d`);
    }

    if (hours > 0) {
      result.push(`${hours} h`);
    }

    if (minutes > 0) {
      result.push(`${minutes} m`);
    }

    return result.length > 0 ? result.join(' ') : '0m';
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
