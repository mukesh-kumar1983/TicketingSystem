/**
 * ============================================================================
 * TicketingSystem - Ticket Models
 * ============================================================================
 *
 * TypeScript models corresponding to the ticket-related DTOs exposed by the
 * TicketingSystem ASP.NET Core API.
 *
 * The backend currently serializes TicketStatus and TicketPriority as
 * numeric enum values. The TypeScript enums therefore intentionally use the
 * same numeric values as the backend.
 * ============================================================================
 */

/**
 * Represents the current workflow state of a support ticket.
 */
export enum TicketStatus {
  /**
   * The ticket has been created but work has not started.
   */
  Open = 1,

  /**
   * A support agent is actively working on the ticket.
   */
  InProgress = 2,

  /**
   * The reported issue has been resolved.
   */
  Resolved = 3,

  /**
   * The ticket has been completed and closed.
   */
  Closed = 4,
}

/**
 * Represents the business priority assigned to a support ticket.
 */
export enum TicketPriority {
  /**
   * Low-priority ticket.
   */
  Low = 1,

  /**
   * Normal-priority ticket.
   */
  Medium = 2,

  /**
   * High-priority ticket.
   */
  High = 3,

  /**
   * Critical ticket requiring immediate attention.
   */
  Critical = 4,
}

/**
 * Represents the information required to create a new support ticket.
 */
export interface CreateTicketRequest {
  /**
   * Title of the support ticket.
   */
  title: string;

  /**
   * Detailed description of the customer's issue.
   */
  description: string;

  /**
   * Priority assigned to the new ticket.
   */
  priority: TicketPriority;
}

/**
 * Represents the information required to add a comment to a ticket.
 *
 * The backend associates the authenticated user with the comment, so the
 * frontend only supplies the comment content.
 */
export interface AddTicketCommentRequest {
  /**
   * Text entered by the user.
   */
  content: string;
}

/**
 * Represents the information required to record work performed
 * against a ticket.
 *
 * The backend receives WorkDate as a DateTime and Duration as a TimeSpan.
 *
 * Angular sends these values as strings which ASP.NET Core converts into
 * the corresponding .NET DateTime and TimeSpan values.
 */
export interface CreateTimeEntryRequest {
  /**
   * Date on which the work was performed.
   *
   * The frontend uses the HTML date format:
   *
   * YYYY-MM-DD
   */
  workDate: string;

  /**
   * Amount of time spent working.
   *
   * The frontend converts HH:mm into HH:mm:ss before sending the request
   * to the ASP.NET Core API.
   */
  duration: string;

  /**
   * Description of the work performed.
   */
  description: string;
}

/**
 * Represents a request to assign a ticket to a support agent.
 *
 * IMPORTANT:
 *
 * This property intentionally uses `agentId` because the backend
 * AssignTicketRequest DTO exposes the property as `AgentId`.
 */
export interface AssignTicketRequest {
  /**
   * Identifier of the support agent who should receive the ticket.
   */
  agentId: string;
}

/**
 * Represents the request used to change the workflow status of a ticket.
 */
export interface UpdateTicketStatusRequest {
  /**
   * New workflow status.
   */
  status: TicketStatus;
}

/**
 * Represents filtering, sorting, and pagination options accepted by
 * GET /api/Tickets.
 */
export interface TicketQueryRequest {
  /**
   * Requested page number.
   */
  pageNumber?: number;

  /**
   * Number of records requested per page.
   */
  pageSize?: number;

  /**
   * Optional search term.
   */
  search?: string;

  /**
   * Optional status filter.
   */
  status?: TicketStatus;

  /**
   * Optional priority filter.
   */
  priority?: TicketPriority;

  /**
   * Optional assigned-agent identifier.
   */
  assignedAgentId?: string;

  /**
   * Backend property used for sorting.
   */
  sortBy?: string;

  /**
   * Indicates whether results should be sorted descending.
   */
  sortDescending?: boolean;
}

/**
 * Represents a support ticket returned by the API.
 */
export interface TicketResponse {
  /**
   * Unique ticket identifier.
   */
  id: number;

  /**
   * Ticket title.
   */
  title: string;

  /**
   * Ticket description.
   */
  description: string;

  /**
   * Current ticket workflow status.
   */
  status: TicketStatus;

  /**
   * Business priority.
   */
  priority: TicketPriority;

  /**
   * Customer identifier.
   */
  customerId: string;

  /**
   * Customer full name.
   */
  customerName: string;

  /**
   * Assigned support-agent identifier.
   */
  assignedAgentId: string | null;

  /**
   * Assigned support-agent full name.
   */
  assignedAgentName: string | null;

  /**
   * Ticket creation date and time.
   */
  createdAt: string;

  /**
   * Last ticket update date and time.
   */
  updatedAt: string;

  /**
   * Total recorded work time.
   *
   * The backend serializes the .NET TimeSpan as a string.
   */
  totalWorkTime: string;
}

/**
 * Represents a comment associated with a ticket.
 *
 * This interface intentionally matches the actual JSON returned by:
 *
 * GET /api/Tickets/{id}/details
 *
 * Example:
 *
 * {
 *   "id": 1,
 *   "ticketId": 3,
 *   "userId": "...",
 *   "userName": "Admin User",
 *   "content": "Fix it soom",
 *   "createdAt": "2026-08-29T05:14:06.8957121"
 * }
 */
export interface TicketCommentResponse {
  /**
   * Comment identifier.
   */
  id: number;

  /**
   * Ticket associated with the comment.
   */
  ticketId: number;

  /**
   * User who created the comment.
   */
  userId: string;

  /**
   * Comment author's display name.
   */
  userName: string;

  /**
   * Comment text.
   */
  content: string;

  /**
   * Comment creation timestamp.
   */
  createdAt: string;

  /**
   * Last modification timestamp.
   *
   * This property is optional because the current backend response does not
   * include it.
   */
  updatedAt?: string;
}

/**
 * Represents an activity entry in the ticket timeline.
 */
export interface TicketActivityResponse {
  /**
   * Activity identifier.
   */
  id: number;

  /**
   * Ticket associated with the activity.
   */
  ticketId?: number;

  /**
   * User responsible for the activity.
   */
  userId?: string;

  /**
   * User display name.
   */
  userName?: string;

  /**
   * Activity type.
   */
  activityType?: string;

  /**
   * Description of the activity.
   */
  description?: string;

  /**
   * Alternative activity message.
   */
  message?: string;

  /**
   * Activity creation timestamp.
   */
  createdAt?: string;
}

/**
 * Represents recorded work returned by the Time Entries API.
 *
 * Backend properties:
 *
 * - Id
 * - TicketId
 * - UserId
 * - UserName
 * - WorkDate
 * - Duration
 * - Description
 */
export interface TicketTimeEntryResponse {
  /**
   * Time-entry identifier.
   */
  id: number;

  /**
   * Ticket identifier.
   */
  ticketId: number;

  /**
   * User who recorded the work.
   */
  userId: string;

  /**
   * Display name of the user who recorded the work.
   */
  userName: string;

  /**
   * Date on which the work was performed.
   */
  workDate: string;

  /**
   * Recorded duration.
   *
   * ASP.NET Core TimeSpan is serialized as a string.
   */
  duration: string;

  /**
   * Description of the work performed.
   */
  description: string;
}

/**
 * Represents the complete response returned by:
 *
 * GET /api/Tickets/{id}/details
 *
 * IMPORTANT:
 *
 * The actual ticket is contained inside the `ticket` property.
 *
 * Comments, activities and time entries are returned as separate collections
 * in the same response envelope.
 */
export interface TicketDetailsResponse {
  /**
   * Core ticket information.
   */
  ticket: TicketResponse;

  /**
   * Comments associated with the ticket.
   */
  comments: TicketCommentResponse[];

  /**
   * Activity history associated with the ticket.
   */
  activities: TicketActivityResponse[];

  /**
   * Recorded work-time entries.
   */
  timeEntries: TicketTimeEntryResponse[];

  /**
   * Total recorded work time returned by the details endpoint.
   *
   * The backend currently returns this at the details-envelope level as well
   * as inside the ticket representation.
   */
  totalWorkTime?: string;
}

/**
 * Represents the paginated response returned by GET /api/Tickets.
 */
export interface TicketQueryResponse {
  /**
   * Tickets returned for the requested page.
   */
  items: TicketResponse[];

  /**
   * Total number of tickets matching the query.
   */
  totalCount: number;

  /**
   * Current page number.
   */
  pageNumber: number;

  /**
   * Current page size.
   */
  pageSize: number;

  /**
   * Total number of available pages.
   */
  totalPages: number;
}

/**
 * Converts a ticket status into a user-friendly label.
 *
 * @param status Numeric ticket status.
 * @returns Human-readable status label.
 */
export function getTicketStatusLabel(status: TicketStatus): string {
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
 * Converts a ticket priority into a user-friendly priority label.
 *
 * @param priority Numeric ticket priority.
 * @returns Human-readable priority label.
 */
export function getTicketPriorityLabel(priority: TicketPriority): string {
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
