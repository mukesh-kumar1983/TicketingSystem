import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  AddTicketCommentRequest,
  AssignTicketRequest,
  CreateTicketRequest,
  CreateTimeEntryRequest,
  TicketCommentResponse,
  TicketDetailsResponse,
  TicketQueryRequest,
  TicketQueryResponse,
  TicketResponse,
  TicketTimeEntryResponse,
  UpdateTicketStatusRequest,
} from '../../models/ticket.models';

/**
 * ============================================================================
 * TicketingSystem - Ticket Service
 * ============================================================================
 *
 * Provides the frontend with a centralized API abstraction for ticket
 * operations.
 *
 * Responsibilities:
 *
 * - Create tickets.
 * - Retrieve paginated tickets.
 * - Retrieve individual tickets.
 * - Retrieve complete ticket details.
 * - Add ticket comments.
 * - Retrieve ticket time entries.
 * - Record ticket work time.
 * - Assign tickets to support agents.
 * - Change ticket status.
 *
 * Authentication is handled by the application's HTTP interceptor.
 * ============================================================================
 */
@Injectable({
  providedIn: 'root',
})
export class TicketService {
  /**
   * Base URL for the ticket API.
   */
  private readonly apiUrl = `${environment.apiUrl}/Tickets`;

  /**
   * Creates an instance of TicketService.
   *
   * @param http Angular HTTP client.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Creates a new support ticket.
   *
   * @param request Ticket creation information.
   * @returns Newly created ticket.
   */
  createTicket(request: CreateTicketRequest): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(this.apiUrl, request);
  }

  /**
   * Retrieves a paginated collection of tickets.
   *
   * @param request Query and pagination options.
   * @returns Paginated ticket collection.
   */
  getTickets(
    request: TicketQueryRequest = {},
  ): Observable<TicketQueryResponse> {
    let params = new HttpParams();

    if (request.pageNumber !== undefined) {
      params = params.set('PageNumber', request.pageNumber.toString());
    }

    if (request.pageSize !== undefined) {
      params = params.set('PageSize', request.pageSize.toString());
    }

    if (request.search?.trim()) {
      params = params.set('Search', request.search.trim());
    }

    if (request.status !== undefined) {
      params = params.set('Status', request.status.toString());
    }

    if (request.priority !== undefined) {
      params = params.set('Priority', request.priority.toString());
    }

    if (request.assignedAgentId?.trim()) {
      params = params.set('AssignedAgentId', request.assignedAgentId.trim());
    }

    if (request.sortBy?.trim()) {
      params = params.set('SortBy', request.sortBy.trim());
    }

    if (request.sortDescending !== undefined) {
      params = params.set('SortDescending', request.sortDescending.toString());
    }

    return this.http.get<TicketQueryResponse>(this.apiUrl, {
      params,
    });
  }

  /**
   * Retrieves a single ticket.
   *
   * @param id Ticket identifier.
   * @returns Ticket information.
   */
  getTicket(id: number): Observable<TicketResponse> {
    return this.http.get<TicketResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Retrieves complete ticket details.
   *
   * The endpoint includes:
   *
   * - Core ticket information.
   * - Comments.
   * - Activity timeline.
   * - Recorded time entries.
   *
   * @param id Ticket identifier.
   * @returns Complete ticket details.
   */
  getTicketDetails(id: number): Observable<TicketDetailsResponse> {
    return this.http.get<TicketDetailsResponse>(`${this.apiUrl}/${id}/details`);
  }

  /**
   * Adds a comment to a ticket.
   *
   * The authenticated backend user becomes the author of the comment.
   *
   * API:
   *
   * POST /api/Tickets/{ticketId}/comments
   *
   * @param ticketId Ticket identifier.
   * @param request Comment information.
   * @returns Newly created comment.
   */
  addComment(
    ticketId: number,
    request: AddTicketCommentRequest,
  ): Observable<TicketCommentResponse> {
    return this.http.post<TicketCommentResponse>(
      `${this.apiUrl}/${ticketId}/comments`,
      request,
    );
  }

  /**
   * Retrieves work-time entries for a ticket.
   *
   * API:
   *
   * GET /api/tickets/{ticketId}/time-entries
   *
   * The Ticket Details endpoint already supplies time entries, so this
   * method is available for cases where the dedicated time-entry endpoint
   * is required.
   *
   * @param ticketId Ticket identifier.
   * @returns Recorded time entries.
   */
  getTimeEntries(ticketId: number): Observable<TicketTimeEntryResponse[]> {
    return this.http.get<TicketTimeEntryResponse[]>(
      `${environment.apiUrl}/tickets/${ticketId}/time-entries`,
    );
  }

  /**
   * Records work performed against a ticket.
   *
   * API:
   *
   * POST /api/tickets/{ticketId}/time-entries
   *
   * @param ticketId Ticket identifier.
   * @param request Work-entry information.
   * @returns Newly created time entry.
   */
  createTimeEntry(
    ticketId: number,
    request: CreateTimeEntryRequest,
  ): Observable<TicketTimeEntryResponse> {
    return this.http.post<TicketTimeEntryResponse>(
      `${environment.apiUrl}/tickets/${ticketId}/time-entries`,
      request,
    );
  }

  /**
   * Assigns a ticket to a support agent.
   *
   * @param id Ticket identifier.
   * @param request Assignment request.
   * @returns Updated ticket.
   */
  assignTicket(
    id: number,
    request: AssignTicketRequest,
  ): Observable<TicketResponse> {
    return this.http.patch<TicketResponse>(
      `${this.apiUrl}/${id}/assign`,
      request,
    );
  }

  /**
   * Changes the workflow status of a ticket.
   *
   * @param id Ticket identifier.
   * @param request Status update request.
   * @returns Updated ticket.
   */
  updateTicketStatus(
    id: number,
    request: UpdateTicketStatusRequest,
  ): Observable<TicketResponse> {
    return this.http.patch<TicketResponse>(
      `${this.apiUrl}/${id}/status`,
      request,
    );
  }
}
