import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { environment } from '../../../environments/environment';

import {
  AddTicketCommentRequest,
  AssignTicketRequest,
  CreateTicketRequest,
  CreateTimeEntryRequest,
  TicketCommentResponse,
  TicketDetailsResponse,
  TicketPriority,
  TicketQueryRequest,
  TicketQueryResponse,
  TicketResponse,
  TicketStatus,
  TicketTimeEntryResponse,
  UpdateTicketStatusRequest,
} from '../../models/ticket.models';

import { TicketService } from '../../core/services/ticket.service';

/**

* ============================================================================
* TicketingSystem - TicketService Unit Tests
* ============================================================================
*
* Comprehensive unit tests for TicketService.
*
* These tests verify:
*
* * TicketService creation.
* * Ticket creation.
* * Ticket retrieval.
* * Ticket pagination.
* * Ticket query parameters.
* * Query parameter trimming.
* * Ticket details retrieval.
* * Comment creation.
* * Time-entry retrieval.
* * Time-entry creation.
* * Ticket assignment.
* * Ticket status updates.
* * Correct HTTP methods.
* * Correct API URLs.
* * Correct request payloads.
* * Correct response handling.
*
* The tests intentionally match the current TicketService implementation
* and ticket models.
*
* No service architecture or production functionality is changed by these
* tests.
* ============================================================================
  */
describe('TicketService', () => {
  let service: TicketService;
  let httpTestingController: HttpTestingController;

  /**
  
  * Base URL used by the Angular application.
    */
  const apiUrl = `${environment.apiUrl}/Tickets`;

  /**
  
  * Base URL used by the ticket time-entry endpoints.
  *
  * TicketService currently uses the lowercase "tickets" path for the
  * time-entry endpoints.
    */
  const timeEntriesApiUrl = `${environment.apiUrl}/tickets`;

  /**
  
  * Creates a representative TicketResponse matching the current model.
  *
  * @returns A valid TicketResponse test object.
    */
  const createTicketResponse = (): TicketResponse => ({
    id: 1,
    title: 'Printer not working',
    description: 'The office printer is not responding.',
    status: TicketStatus.Open,
    priority: TicketPriority.Medium,
    customerId: 'customer-001',
    customerName: 'John Customer',
    assignedAgentId: 'agent-001',
    assignedAgentName: 'Support Agent',
    createdAt: '2026-08-28T10:00:00Z',
    updatedAt: '2026-08-28T10:00:00Z',
    totalWorkTime: '00:00:00',
  });

  /**
  
  * Creates a representative paginated ticket response.
  *
  * @returns A valid TicketQueryResponse test object.
    */
  const createTicketQueryResponse = (): TicketQueryResponse => ({
    items: [createTicketResponse()],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
  });

  /**
  
  * Creates a representative comment response.
  *
  * @returns A valid TicketCommentResponse test object.
    */
  const createCommentResponse = (): TicketCommentResponse => ({
    id: 1,
    userId: 'user-001',
    userName: 'John User',
    content: 'The issue has been reported to the support team.',
    createdAt: '2026-08-28T10:30:00Z',
    updatedAt: '2026-08-28T10:30:00Z',
  });

  /**
  
  * Creates a representative time-entry creation request.
  *
  * @returns A valid CreateTimeEntryRequest test object.
    */
  const createTimeEntryRequest = (): CreateTimeEntryRequest => ({
    workDate: '2026-08-28',
    duration: '00:45:00',
    description: 'Investigated the printer issue.',
  });

  /**
  
  * Creates a representative time-entry response.
  *
  * @returns A valid TicketTimeEntryResponse test object.
    */
  const createTimeEntryResponse = (): TicketTimeEntryResponse => ({
    id: 1,
    ticketId: 1,
    userId: 'agent-001',
    userName: 'Support Agent',
    workDate: '2026-08-28',
    duration: '00:45:00',
    description: 'Investigated the printer issue.',
  });

  /**
  
  * Creates a representative complete ticket-details response.
  *
  * @returns A valid TicketDetailsResponse test object.
    */
  const createTicketDetailsResponse = (): TicketDetailsResponse => ({
    ticket: createTicketResponse(),
    comments: [createCommentResponse()],
    activities: [
      {
        id: 1,
        description: 'Ticket created',
        message: 'Ticket was created.',
        userName: 'John Customer',
        createdAt: '2026-08-28T10:00:00Z',
      },
    ],
    timeEntries: [createTimeEntryResponse()],
  });

  /**
  
  * Creates a representative ticket creation request.
  *
  * @returns A valid CreateTicketRequest test object.
    */
  const createTicketRequest = (): CreateTicketRequest => ({
    title: 'Printer not working',
    description: 'The office printer is not responding.',
    priority: TicketPriority.Medium,
  });

  /**
  
  * Creates a representative comment request.
  *
  * @returns A valid AddTicketCommentRequest test object.
    */
  const createCommentRequest = (): AddTicketCommentRequest => ({
    content: 'Please investigate this issue.',
  });

  /**
  
  * Creates a representative assignment request.
  *
  * @returns A valid AssignTicketRequest test object.
    */
  const createAssignTicketRequest = (): AssignTicketRequest => ({
    agentId: 'agent-001',
  });

  /**
  
  * Creates a representative status update request.
  *
  * @returns A valid UpdateTicketStatusRequest test object.
    */
  const createUpdateTicketStatusRequest = (): UpdateTicketStatusRequest => ({
    status: TicketStatus.InProgress,
  });

  /**
  
  * Configure the Angular testing environment before each test.
    */
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(TicketService);

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  /**
  
  * Ensure that every HTTP request created by a test has been completed.
    */
  afterEach(() => {
    httpTestingController.verify();
  });

  /**
  
  * Verifies that Angular can create the TicketService.
    */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
  
  * Verifies that createTicket sends a POST request to the tickets endpoint.
    */
  it('should create a ticket', () => {
    const request = createTicketRequest();

    service.createTicket(request).subscribe((ticket) => {
      expect(ticket).toEqual(createTicketResponse());
    });

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual(request);

    httpRequest.flush(createTicketResponse());
  });

  /**
  
  * Verifies that createTicket returns the API response.
    */
  it('should return the created ticket from createTicket', () => {
    const response = createTicketResponse();

    service.createTicket(createTicketRequest()).subscribe((ticket) => {
      expect(ticket).toEqual(response);
      expect(ticket.id).toBe(1);
      expect(ticket.title).toBe('Printer not working');
    });

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.method).toBe('POST');

    httpRequest.flush(response);
  });

  /**
  
  * Verifies that getTickets uses GET.
    */
  it('should retrieve tickets using GET', () => {
    service.getTickets().subscribe((response) => {
      expect(response).toEqual(createTicketQueryResponse());
    });

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.method).toBe('GET');

    httpRequest.flush(createTicketQueryResponse());
  });

  /**
  
  * Verifies that pageNumber is sent using the backend property name.
    */
  it('should send page number as a query parameter', () => {
    service
      .getTickets({
        pageNumber: 2,
      })
      .subscribe();

    const httpRequest = httpTestingController.expectOne(
      (request) =>
        request.url === apiUrl && request.params.get('PageNumber') === '2',
    );

    expect(httpRequest.request.method).toBe('GET');
    expect(httpRequest.request.params.get('PageNumber')).toBe('2');

    httpRequest.flush(createTicketQueryResponse());
  });

  /**
  
  * Verifies that pageSize is sent using the backend property name.
    */
  it('should send page size as a query parameter', () => {
    service
      .getTickets({
        pageSize: 25,
      })
      .subscribe();

    const httpRequest = httpTestingController.expectOne(
      (request) =>
        request.url === apiUrl && request.params.get('PageSize') === '25',
    );

    expect(httpRequest.request.method).toBe('GET');
    expect(httpRequest.request.params.get('PageSize')).toBe('25');

    httpRequest.flush(createTicketQueryResponse());
  });

  /**
  
  * Verifies that a search value is sent to the API.
    */
  it('should send the search query parameter', () => {
    service
      .getTickets({
        search: 'printer',
      })
      .subscribe();

    const httpRequest = httpTestingController.expectOne(
      (request) =>
        request.url === apiUrl && request.params.get('Search') === 'printer',
    );

    expect(httpRequest.request.method).toBe('GET');
    expect(httpRequest.request.params.get('Search')).toBe('printer');

    httpRequest.flush(createTicketQueryResponse());
  });

  /**
  
  * Verifies that search values are trimmed before being sent.
    */
  it('should trim the search query parameter', () => {
    service
      .getTickets({
        search: '  printer  ',
      })
      .subscribe();

    const httpRequest = httpTestingController.expectOne(
      (request) =>
        request.url === apiUrl && request.params.get('Search') === 'printer',
    );

    expect(httpRequest.request.method).toBe('GET');
    expect(httpRequest.request.params.get('Search')).toBe('printer');

    httpRequest.flush(createTicketQueryResponse());
  });

  /**
  
  * Verifies that whitespace-only search values are not sent.
    */
  it('should not send a whitespace-only search parameter', () => {
    service
      .getTickets({
        search: '     ',
      })
      .subscribe();

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.method).toBe('GET');
    expect(httpRequest.request.params.has('Search')).toBeFalse();

    httpRequest.flush(createTicketQueryResponse());
  });

  /**
  
  * Verifies that status is converted to its numeric string value.
    */
  it('should send the status query parameter', () => {
    service
      .getTickets({
        status: TicketStatus.InProgress,
      })
      .subscribe();

    const httpRequest = httpTestingController.expectOne(
      (request) =>
        request.url === apiUrl && request.params.get('Status') === '2',
    );

    expect(httpRequest.request.method).toBe('GET');
    expect(httpRequest.request.params.get('Status')).toBe('2');

    httpRequest.flush(createTicketQueryResponse());
  });

  /**
  
  * Verifies that priority is converted to its numeric string value.
    */
  it('should send the priority query parameter', () => {
    service
      .getTickets({
        priority: TicketPriority.High,
      })
      .subscribe();

    const httpRequest = httpTestingController.expectOne(
      (request) =>
        request.url === apiUrl && request.params.get('Priority') === '3',
    );

    expect(httpRequest.request.method).toBe('GET');
    expect(httpRequest.request.params.get('Priority')).toBe('3');

    httpRequest.flush(createTicketQueryResponse());
  });

  /**
  
  * Verifies that assignedAgentId is trimmed before being sent.
    */
  it('should trim the assigned agent query parameter', () => {
    service
      .getTickets({
        assignedAgentId: '  agent-001  ',
      })
      .subscribe();

    const httpRequest = httpTestingController.expectOne(
      (request) =>
        request.url === apiUrl &&
        request.params.get('AssignedAgentId') === 'agent-001',
    );

    expect(httpRequest.request.method).toBe('GET');
    expect(httpRequest.request.params.get('AssignedAgentId')).toBe('agent-001');

    httpRequest.flush(createTicketQueryResponse());
  });

  /**
  
  * Verifies that whitespace-only assigned-agent values are ignored.
    */
  it('should not send a whitespace-only assigned agent parameter', () => {
    service
      .getTickets({
        assignedAgentId: '     ',
      })
      .subscribe();

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.params.has('AssignedAgentId')).toBeFalse();

    httpRequest.flush(createTicketQueryResponse());
  });

  /**
  
  * Verifies that sortBy is trimmed before being sent.
    */
  it('should trim the sortBy query parameter', () => {
    service
      .getTickets({
        sortBy: '  createdAt  ',
      })
      .subscribe();

    const httpRequest = httpTestingController.expectOne(
      (request) =>
        request.url === apiUrl && request.params.get('SortBy') === 'createdAt',
    );

    expect(httpRequest.request.method).toBe('GET');
    expect(httpRequest.request.params.get('SortBy')).toBe('createdAt');

    httpRequest.flush(createTicketQueryResponse());
  });

  /**
  
  * Verifies that whitespace-only sortBy values are ignored.
    */
  it('should not send a whitespace-only sortBy parameter', () => {
    service
      .getTickets({
        sortBy: '     ',
      })
      .subscribe();

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.params.has('SortBy')).toBeFalse();

    httpRequest.flush(createTicketQueryResponse());
  });

  /**
  
  * Verifies that sortDescending is converted to a string.
    */
  it('should send the sortDescending query parameter', () => {
    service
      .getTickets({
        sortDescending: true,
      })
      .subscribe();

    const httpRequest = httpTestingController.expectOne(
      (request) =>
        request.url === apiUrl &&
        request.params.get('SortDescending') === 'true',
    );

    expect(httpRequest.request.method).toBe('GET');
    expect(httpRequest.request.params.get('SortDescending')).toBe('true');

    httpRequest.flush(createTicketQueryResponse());
  });

  /**
  
  * Verifies that false is also sent when sortDescending is false.
    */
  it('should send false for sortDescending when explicitly specified', () => {
    service
      .getTickets({
        sortDescending: false,
      })
      .subscribe();

    const httpRequest = httpTestingController.expectOne(
      (request) =>
        request.url === apiUrl &&
        request.params.get('SortDescending') === 'false',
    );

    expect(httpRequest.request.method).toBe('GET');
    expect(httpRequest.request.params.get('SortDescending')).toBe('false');

    httpRequest.flush(createTicketQueryResponse());
  });

  /**
  
  * Verifies that all supported query parameters are sent together.
    */
  it('should send all ticket query parameters', () => {
    const request: TicketQueryRequest = {
      pageNumber: 2,
      pageSize: 20,
      search: 'printer',
      status: TicketStatus.InProgress,
      priority: TicketPriority.High,
      assignedAgentId: 'agent-001',
      sortBy: 'createdAt',
      sortDescending: true,
    };

    service.getTickets(request).subscribe();

    const httpRequest = httpTestingController.expectOne(
      (request) =>
        request.url === apiUrl &&
        request.params.get('PageNumber') === '2' &&
        request.params.get('PageSize') === '20' &&
        request.params.get('Search') === 'printer' &&
        request.params.get('Status') === '2' &&
        request.params.get('Priority') === '3' &&
        request.params.get('AssignedAgentId') === 'agent-001' &&
        request.params.get('SortBy') === 'createdAt' &&
        request.params.get('SortDescending') === 'true',
    );

    expect(httpRequest.request.method).toBe('GET');
    expect(httpRequest.request.params.get('PageNumber')).toBe('2');
    expect(httpRequest.request.params.get('PageSize')).toBe('20');
    expect(httpRequest.request.params.get('Search')).toBe('printer');
    expect(httpRequest.request.params.get('Status')).toBe('2');
    expect(httpRequest.request.params.get('Priority')).toBe('3');
    expect(httpRequest.request.params.get('AssignedAgentId')).toBe('agent-001');
    expect(httpRequest.request.params.get('SortBy')).toBe('createdAt');
    expect(httpRequest.request.params.get('SortDescending')).toBe('true');

    httpRequest.flush(createTicketQueryResponse());
  });

  /**
  
  * Verifies that getTickets does not add undefined query parameters.
    */
  it('should not send undefined query parameters', () => {
    service
      .getTickets({
        pageNumber: undefined,
        pageSize: undefined,
        search: undefined,
        status: undefined,
        priority: undefined,
        assignedAgentId: undefined,
        sortBy: undefined,
        sortDescending: undefined,
      })
      .subscribe();

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.method).toBe('GET');
    expect(httpRequest.request.params.keys().length).toBe(0);

    httpRequest.flush(createTicketQueryResponse());
  });

  /**
  
  * Verifies that getTickets returns the complete pagination response.
    */
  it('should return the complete ticket query response', () => {
    const response = createTicketQueryResponse();

    service.getTickets().subscribe((result) => {
      expect(result).toEqual(response);
      expect(result.items.length).toBe(1);
      expect(result.totalCount).toBe(1);
      expect(result.pageNumber).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    const httpRequest = httpTestingController.expectOne(apiUrl);

    httpRequest.flush(response);
  });

  /**
  
  * Verifies that getTicket requests the correct numeric ticket URL.
    */
  it('should retrieve a ticket by id', () => {
    service.getTicket(1).subscribe((ticket) => {
      expect(ticket).toEqual(createTicketResponse());
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1`);

    expect(httpRequest.request.method).toBe('GET');

    httpRequest.flush(createTicketResponse());
  });

  /**

* Verifies that getTicket uses the supplied ticket identifier.
  */
  it('should use the supplied ticket id when retrieving a ticket', () => {
    service.getTicket(25).subscribe();

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/25`);

    expect(httpRequest.request.method).toBe('GET');

    httpRequest.flush(createTicketResponse());
  });

  /**

* Verifies that getTicketDetails requests the details endpoint.
  */
  it('should retrieve complete ticket details', () => {
    const response = createTicketDetailsResponse();

    service.getTicketDetails(1).subscribe((details) => {
      expect(details).toEqual(response);
      expect(details.ticket.id).toBe(1);
      expect(details.comments.length).toBe(1);
      expect(details.activities.length).toBe(1);
      expect(details.timeEntries.length).toBe(1);
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1/details`);

    expect(httpRequest.request.method).toBe('GET');

    httpRequest.flush(response);
  });

  /**

* Verifies that getTicketDetails uses the supplied ticket identifier.
  */
  it('should use the supplied ticket id for ticket details', () => {
    service.getTicketDetails(15).subscribe();

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/15/details`);

    expect(httpRequest.request.method).toBe('GET');

    httpRequest.flush(createTicketDetailsResponse());
  });

  /**

* Verifies that addComment sends a POST request.
  */
  it('should add a comment to a ticket', () => {
    const request = createCommentRequest();
    const response = createCommentResponse();

    service.addComment(1, request).subscribe((comment) => {
      expect(comment).toEqual(response);
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1/comments`);

    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual(request);

    httpRequest.flush(response);
  });

  /**

* Verifies that addComment uses the supplied ticket identifier.
  */
  it('should use the supplied ticket id when adding a comment', () => {
    service.addComment(20, createCommentRequest()).subscribe();

    const httpRequest = httpTestingController.expectOne(
      `${apiUrl}/20/comments`,
    );

    expect(httpRequest.request.method).toBe('POST');

    httpRequest.flush(createCommentResponse());
  });

  /**

* Verifies that addComment sends only the supported content property.
  */
  it('should send the comment content in the request body', () => {
    const request: AddTicketCommentRequest = {
      content: 'Additional information about the issue.',
    };

    service.addComment(1, request).subscribe();

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1/comments`);

    expect(httpRequest.request.body).toEqual({
      content: 'Additional information about the issue.',
    });

    httpRequest.flush(createCommentResponse());
  });

  /**
   *
   * Verifies that getTimeEntries uses the exact lowercase tickets API path
   * implemented by TicketService.
   */
  it('should retrieve ticket time entries', () => {
    const response = [createTimeEntryResponse()];
    const url = `${timeEntriesApiUrl}/1/time-entries`;

    service.getTimeEntries(1).subscribe((entries) => {
      expect(entries).toEqual(response);
      expect(entries.length).toBe(1);
    });

    const httpRequest = httpTestingController.expectOne(url);

    expect(httpRequest.request.method).toBe('GET');

    httpRequest.flush(response);
  });

  /**

* Verifies that getTimeEntries uses the supplied ticket identifier.
  */
  it('should use the supplied ticket id when retrieving time entries', () => {
    const url = `${timeEntriesApiUrl}/1/time-entries`;

    service.getTimeEntries(1).subscribe();

    const httpRequest = httpTestingController.expectOne(url);

    expect(httpRequest.request.method).toBe('GET');

    httpRequest.flush([]);
  });

  /**

* Verifies that createTimeEntry sends a POST request.
  */
  it('should create a ticket time entry', () => {
    const request = createTimeEntryRequest();
    const response = createTimeEntryResponse();
    const url = `${timeEntriesApiUrl}/1/time-entries`;

    service.createTimeEntry(1, request).subscribe((entry) => {
      expect(entry).toEqual(response);
    });

    const httpRequest = httpTestingController.expectOne(url);

    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual(request);

    httpRequest.flush(response);
  });

  /**

* Verifies that createTimeEntry uses the supplied ticket identifier.
  */
  it('should use the supplied ticket id when creating a time entry', () => {
    const url = `${timeEntriesApiUrl}/12/time-entries`;

    service.createTimeEntry(12, createTimeEntryRequest()).subscribe();

    const httpRequest = httpTestingController.expectOne(url);

    expect(httpRequest.request.method).toBe('POST');

    httpRequest.flush(createTimeEntryResponse());
  });

  /**

* Verifies that createTimeEntry sends the current request shape.
  */
  it('should send workDate duration and description for a time entry', () => {
    const request: CreateTimeEntryRequest = {
      workDate: '2026-08-28',
      duration: '01:30:00',
      description: 'Worked on troubleshooting and resolution.',
    };

    const url = `${timeEntriesApiUrl}/1/time-entries`;

    service.createTimeEntry(1, request).subscribe();

    const httpRequest = httpTestingController.expectOne(url);

    expect(httpRequest.request.body).toEqual({
      workDate: '2026-08-28',
      duration: '01:30:00',
      description: 'Worked on troubleshooting and resolution.',
    });

    httpRequest.flush(createTimeEntryResponse());
  });

  /**

* Verifies that assignTicket uses PATCH.
  */
  it('should assign a ticket to an agent', () => {
    const request = createAssignTicketRequest();
    const response = createTicketResponse();

    service.assignTicket(1, request).subscribe((ticket) => {
      expect(ticket).toEqual(response);
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1/assign`);

    expect(httpRequest.request.method).toBe('PATCH');
    expect(httpRequest.request.body).toEqual(request);

    httpRequest.flush(response);
  });

  /**

* Verifies that assignTicket uses the supplied ticket identifier.
  */
  it('should use the supplied ticket id when assigning a ticket', () => {
    const request: AssignTicketRequest = {
      agentId: 'agent-002',
    };

    service.assignTicket(30, request).subscribe();

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/30/assign`);

    expect(httpRequest.request.method).toBe('PATCH');
    expect(httpRequest.request.body).toEqual(request);

    httpRequest.flush(createTicketResponse());
  });

  /**

* Verifies that updateTicketStatus uses PATCH.
  */
  it('should update the ticket status', () => {
    const request = createUpdateTicketStatusRequest();
    const response = createTicketResponse();

    service.updateTicketStatus(1, request).subscribe((ticket) => {
      expect(ticket).toEqual(response);
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1/status`);

    expect(httpRequest.request.method).toBe('PATCH');
    expect(httpRequest.request.body).toEqual(request);

    httpRequest.flush(response);
  });

  /**

* Verifies that updateTicketStatus uses the supplied ticket identifier.
  */
  it('should use the supplied ticket id when updating status', () => {
    const request: UpdateTicketStatusRequest = {
      status: TicketStatus.Resolved,
    };

    service.updateTicketStatus(40, request).subscribe();

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/40/status`);

    expect(httpRequest.request.method).toBe('PATCH');
    expect(httpRequest.request.body).toEqual(request);

    httpRequest.flush(createTicketResponse());
  });

  /**

* Verifies that a null assigned agent is supported by TicketResponse.
  */
  it('should handle a ticket without an assigned agent', () => {
    const response: TicketResponse = {
      ...createTicketResponse(),
      assignedAgentId: null,
      assignedAgentName: null,
    };

    service.getTicket(1).subscribe((ticket) => {
      expect(ticket.assignedAgentId).toBeNull();
      expect(ticket.assignedAgentName).toBeNull();
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1`);

    httpRequest.flush(response);
  });

  /**

* Verifies that an empty ticket collection is supported.
  */
  it('should handle an empty ticket query response', () => {
    const response: TicketQueryResponse = {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 0,
    };

    service.getTickets().subscribe((result) => {
      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    const httpRequest = httpTestingController.expectOne(apiUrl);

    httpRequest.flush(response);
  });

  /**

* Verifies that an empty comments collection is supported by
* TicketDetailsResponse.
  */
  it('should handle ticket details without comments', () => {
    const response: TicketDetailsResponse = {
      ticket: createTicketResponse(),
      comments: [],
      activities: [],
      timeEntries: [],
    };

    service.getTicketDetails(1).subscribe((details) => {
      expect(details.comments).toEqual([]);
      expect(details.activities).toEqual([]);
      expect(details.timeEntries).toEqual([]);
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1/details`);

    httpRequest.flush(response);
  });

  /**

* Verifies that TicketService does not accidentally send query parameters
* for a request with an empty query object.
  */
  it('should send no query parameters for an empty query object', () => {
    service.getTickets({}).subscribe();

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.params.keys()).toEqual([]);

    httpRequest.flush(createTicketQueryResponse());
  });

  /**

* Verifies that the service preserves the exact ticket creation payload.
  */
  it('should preserve the ticket creation request payload', () => {
    const request: CreateTicketRequest = {
      title: 'Network problem',
      description: 'The workstation cannot connect to the network.',
      priority: TicketPriority.High,
    };

    service.createTicket(request).subscribe();

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.body).toEqual(request);

    httpRequest.flush(createTicketResponse());
  });

  /**

* Verifies that low priority can be submitted correctly.
  */
  it('should support low ticket priority', () => {
    const request: CreateTicketRequest = {
      title: 'Minor issue',
      description: 'Minor support issue.',
      priority: TicketPriority.Low,
    };

    service.createTicket(request).subscribe();

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.body.priority).toBe(TicketPriority.Low);

    httpRequest.flush(createTicketResponse());
  });

  /**

* Verifies that critical priority can be submitted correctly.
  */
  it('should support critical ticket priority', () => {
    const request: CreateTicketRequest = {
      title: 'Critical issue',
      description: 'Production service is unavailable.',
      priority: TicketPriority.Critical,
    };

    service.createTicket(request).subscribe();

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.body.priority).toBe(TicketPriority.Critical);

    httpRequest.flush(createTicketResponse());
  });

  /**

* Verifies that the service does not alter the supplied comment content.
  */
  it('should preserve comment content', () => {
    const request: AddTicketCommentRequest = {
      content: '  Comment containing intentional spacing  ',
    };

    service.addComment(1, request).subscribe();

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1/comments`);

    expect(httpRequest.request.body).toEqual(request);

    httpRequest.flush(createCommentResponse());
  });

  /**

* Verifies that the time-entry duration is passed to the API unchanged.
  */
  it('should preserve time-entry duration', () => {
    const request: CreateTimeEntryRequest = {
      workDate: '2026-08-28',
      duration: '02:15:00',
      description: 'Development work.',
    };

    const url = `${timeEntriesApiUrl}/1/time-entries`;

    service.createTimeEntry(1, request).subscribe();

    const httpRequest = httpTestingController.expectOne(url);

    expect(httpRequest.request.body.duration).toBe('02:15:00');

    httpRequest.flush(createTimeEntryResponse());
  });

  /**

* Verifies that getTimeEntries returns the response from the API.
  */
  it('should return time entries from getTimeEntries', () => {
    const response: TicketTimeEntryResponse[] = [
      createTimeEntryResponse(),
      {
        ...createTimeEntryResponse(),
        id: 2,
        duration: '01:00:00',
        description: 'Resolved the printer issue.',
      },
    ];

    const url = `${timeEntriesApiUrl}/1/time-entries`;

    service.getTimeEntries(1).subscribe((entries) => {
      expect(entries).toEqual(response);
      expect(entries.length).toBe(2);
      expect(entries[0].duration).toBe('00:45:00');
      expect(entries[1].duration).toBe('01:00:00');
    });

    const httpRequest = httpTestingController.expectOne(url);

    httpRequest.flush(response);
  });

  /**

* Verifies that createTimeEntry returns the API response.
  */
  it('should return the created time entry', () => {
    const response = createTimeEntryResponse();
    const url = `${timeEntriesApiUrl}/1/time-entries`;

    service.createTimeEntry(1, createTimeEntryRequest()).subscribe((entry) => {
      expect(entry).toEqual(response);
      expect(entry.id).toBe(1);
      expect(entry.ticketId).toBe(1);
    });

    const httpRequest = httpTestingController.expectOne(url);

    httpRequest.flush(response);
  });

  /**

* Verifies that assignTicket returns the updated ticket.
  */
  it('should return the updated ticket after assignment', () => {
    const response: TicketResponse = {
      ...createTicketResponse(),
      assignedAgentId: 'agent-002',
      assignedAgentName: 'Another Agent',
    };

    service

      .assignTicket(1, {
        agentId: 'agent-002',
      })
      .subscribe((ticket) => {
        expect(ticket.assignedAgentId).toBe('agent-002');
        expect(ticket.assignedAgentName).toBe('Another Agent');
      });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1/assign`);

    httpRequest.flush(response);
  });

  /**

* Verifies that updateTicketStatus returns the updated ticket.
  */
  it('should return the updated ticket after status update', () => {
    const response: TicketResponse = {
      ...createTicketResponse(),
      status: TicketStatus.Resolved,
    };

    service

      .updateTicketStatus(1, {
        status: TicketStatus.Resolved,
      })
      .subscribe((ticket) => {
        expect(ticket.status).toBe(TicketStatus.Resolved);
      });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1/status`);

    httpRequest.flush(response);
  });

  /**

* Verifies that the service correctly handles a ticket with zero work time.
  */
  it('should preserve zero total work time', () => {
    const response: TicketResponse = {
      ...createTicketResponse(),
      totalWorkTime: '00:00:00',
    };

    service.getTicket(1).subscribe((ticket) => {
      expect(ticket.totalWorkTime).toBe('00:00:00');
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1`);

    httpRequest.flush(response);
  });

  /**

* Verifies that the service correctly handles a ticket with recorded work.
  */
  it('should preserve total ticket work time', () => {
    const response: TicketResponse = {
      ...createTicketResponse(),
      totalWorkTime: '02:30:00',
    };

    service.getTicket(1).subscribe((ticket) => {
      expect(ticket.totalWorkTime).toBe('02:30:00');
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1`);

    httpRequest.flush(response);
  });

  /**

* Verifies that the details envelope preserves the ticket object.
  */
  it('should preserve the ticket object inside ticket details', () => {
    const response = createTicketDetailsResponse();

    service.getTicketDetails(1).subscribe((details) => {
      expect(details.ticket).toEqual(response.ticket);
      expect(details.ticket.id).toBe(response.ticket.id);
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1/details`);

    httpRequest.flush(response);
  });

  /**

* Verifies that comments are preserved inside ticket details.
  */
  it('should preserve comments inside ticket details', () => {
    const response = createTicketDetailsResponse();

    service.getTicketDetails(1).subscribe((details) => {
      expect(details.comments).toEqual(response.comments);
      expect(details.comments[0].content).toBe(
        'The issue has been reported to the support team.',
      );
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1/details`);

    httpRequest.flush(response);
  });

  /**

* Verifies that activities are preserved inside ticket details.
  */
  it('should preserve activities inside ticket details', () => {
    const response = createTicketDetailsResponse();

    service.getTicketDetails(1).subscribe((details) => {
      expect(details.activities).toEqual(response.activities);
      expect(details.activities[0].description).toBe('Ticket created');
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1/details`);

    httpRequest.flush(response);
  });

  /**

* Verifies that time entries are preserved inside ticket details.
  */
  it('should preserve time entries inside ticket details', () => {
    const response = createTicketDetailsResponse();

    service.getTicketDetails(1).subscribe((details) => {
      expect(details.timeEntries).toEqual(response.timeEntries);
      expect(details.timeEntries[0].duration).toBe('00:45:00');
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/1/details`);

    httpRequest.flush(response);
  });

  /**

* Verifies that getTickets can combine pagination with filtering.
  */
  it('should combine pagination and filters', () => {
    service
      .getTickets({
        pageNumber: 3,
        pageSize: 15,
        status: TicketStatus.Open,
        priority: TicketPriority.Critical,
      })
      .subscribe();

    const httpRequest = httpTestingController.expectOne(
      (request) =>
        request.url === apiUrl &&
        request.params.get('PageNumber') === '3' &&
        request.params.get('PageSize') === '15' &&
        request.params.get('Status') === '1' &&
        request.params.get('Priority') === '4',
    );

    expect(httpRequest.request.params.get('PageNumber')).toBe('3');
    expect(httpRequest.request.params.get('PageSize')).toBe('15');
    expect(httpRequest.request.params.get('Status')).toBe('1');
    expect(httpRequest.request.params.get('Priority')).toBe('4');

    httpRequest.flush(createTicketQueryResponse());
  });

  /**

* Verifies that zero-valued pagination values are still transmitted when
* explicitly provided.
  */
  it('should send explicitly provided zero pagination values', () => {
    service
      .getTickets({
        pageNumber: 0,
        pageSize: 0,
      })
      .subscribe();

    const httpRequest = httpTestingController.expectOne(
      (request) =>
        request.url === apiUrl &&
        request.params.get('PageNumber') === '0' &&
        request.params.get('PageSize') === '0',
    );

    expect(httpRequest.request.params.get('PageNumber')).toBe('0');
    expect(httpRequest.request.params.get('PageSize')).toBe('0');

    httpRequest.flush(createTicketQueryResponse());
  });

  /**

* Verifies that getTicket constructs the URL using the supplied id.
  */
  it('should construct the correct getTicket URL', () => {
    service.getTicket(999).subscribe();

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/999`);

    expect(httpRequest.request.url).toBe(`${apiUrl}/999`);

    httpRequest.flush(createTicketResponse());
  });

  /**

* Verifies that getTicketDetails constructs the correct URL.
  */
  it('should construct the correct getTicketDetails URL', () => {
    service.getTicketDetails(999).subscribe();

    const httpRequest = httpTestingController.expectOne(
      `${apiUrl}/999/details`,
    );

    expect(httpRequest.request.url).toBe(`${apiUrl}/999/details`);

    httpRequest.flush(createTicketDetailsResponse());
  });

  /**

* Verifies that addComment constructs the correct URL.
  */
  it('should construct the correct addComment URL', () => {
    service.addComment(999, createCommentRequest()).subscribe();

    const httpRequest = httpTestingController.expectOne(
      `${apiUrl}/999/comments`,
    );

    expect(httpRequest.request.url).toBe(`${apiUrl}/999/comments`);

    httpRequest.flush(createCommentResponse());
  });

  /**

* Verifies that assignTicket constructs the correct URL.
  */
  it('should construct the correct assignTicket URL', () => {
    service.assignTicket(999, createAssignTicketRequest()).subscribe();

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/999/assign`);

    expect(httpRequest.request.url).toBe(`${apiUrl}/999/assign`);

    httpRequest.flush(createTicketResponse());
  });

  /**

* Verifies that updateTicketStatus constructs the correct URL.
  */
  it('should construct the correct updateTicketStatus URL', () => {
    service
      .updateTicketStatus(999, createUpdateTicketStatusRequest())
      .subscribe();

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/999/status`);

    expect(httpRequest.request.url).toBe(`${apiUrl}/999/status`);

    httpRequest.flush(createTicketResponse());
  });
});
