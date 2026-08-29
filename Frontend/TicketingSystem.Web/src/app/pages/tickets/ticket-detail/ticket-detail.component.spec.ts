import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { TicketDetailComponent } from './ticket-detail.component';
import { TicketService } from '../../../core/services/ticket.service';
import { UserService } from '../../../core/services/user.service';

import {
  AddTicketCommentRequest,
  AssignTicketRequest,
  CreateTimeEntryRequest,
  TicketActivityResponse,
  TicketCommentResponse,
  TicketDetailsResponse,
  TicketPriority,
  TicketResponse,
  TicketStatus,
  TicketTimeEntryResponse,
  UpdateTicketStatusRequest,
} from '../../../models/ticket.models';

import { UserResponse } from '../../../models/user.models';

/**
 * ============================================================================
 * TicketingSystem - Ticket Detail Component Unit Tests
 * ============================================================================
 *
 * Comprehensive Jasmine unit tests for TicketDetailComponent.
 *
 * The test suite covers:
 *
 * - Component creation.
 * - Route ticket-ID validation.
 * - Ticket-details loading.
 * - Basic-ticket fallback loading.
 * - HTTP error handling.
 * - Comment creation and validation.
 * - Time-entry creation and validation.
 * - Agent loading.
 * - Ticket assignment.
 * - Ticket-status updates.
 * - Navigation.
 * - Status and priority labels/classes.
 * - Date and duration formatting.
 * - Agent-name and initial helpers.
 * - Computed collections.
 * - Private duration helpers.
 * - Post-time-entry details refresh.
 *
 * Existing application behavior is intentionally preserved.
 * ============================================================================
 */
describe('TicketDetailComponent', () => {
  let component: TicketDetailComponent;
  let fixture: ComponentFixture<TicketDetailComponent>;

  let ticketServiceSpy: jasmine.SpyObj<TicketService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let routerSpy: jasmine.SpyObj<Router>;

  let routeParamId: string | null;

  /**
   * Standard ticket fixture used by the test suite.
   */
  const ticket: TicketResponse = {
    id: 1,
    title: 'Printer is not working',
    description: 'The office printer is unavailable.',
    priority: TicketPriority.High,
    status: TicketStatus.Open,
    customerId: 'customer-1',
    customerName: 'John Customer',
    assignedAgentId: 'agent-1',
    assignedAgentName: 'Jane Agent',
    createdAt: '2026-08-28T10:00:00Z',
    updatedAt: '2026-08-28T11:00:00Z',
    totalWorkTime: '00:00:00',
  };

  /**
   * Updated ticket fixture returned by assignment/status operations.
   */
  const updatedTicket: TicketResponse = {
    ...ticket,
    assignedAgentId: 'agent-2',
    assignedAgentName: 'Second Agent',
    status: TicketStatus.InProgress,
  };

  /**
   * Primary support-agent fixture.
   */
  const agent: UserResponse = {
    id: 'agent-1',
    firstName: 'Jane',
    lastName: 'Agent',
    email: 'jane@example.com',
    role: 'SupportAgent',
  };

  /**
   * Secondary support-agent fixture.
   */
  const secondAgent: UserResponse = {
    id: 'agent-2',
    firstName: 'Second',
    lastName: 'Agent',
    email: 'second@example.com',
    role: 'SupportAgent',
  };

  /**
   * Comment fixture returned by the comment endpoint.
   */
  const comment: TicketCommentResponse = {
    id: 10,
    content: 'This issue is being investigated.',
    userId: 'agent-1',
    userName: 'Jane Agent',
    createdAt: '2026-08-28T12:00:00Z',
  };

  /**
   * Activity fixture returned by the ticket-details endpoint.
   */
  const activity = {
    id: 20,
    ticketId: 1,
    userId: 'agent-1',
    userName: 'Jane Agent',
    description: 'Ticket created',
    createdAt: '2026-08-28T10:00:00Z',
  } as unknown as TicketActivityResponse;

  /**
   * Time-entry fixture returned by the time-entry endpoint.
   */
  const timeEntry: TicketTimeEntryResponse = {
    id: 30,
    ticketId: 1,
    workDate: '2026-08-28',
    duration: '01:30:00',
    description: 'Investigated printer configuration.',
    userId: 'agent-1',
    userName: 'Jane Agent',
  };

  /**
   * Standard ticket-details response fixture.
   */
  const ticketDetails: TicketDetailsResponse = {
    ticket,
    comments: [],
    activities: [activity],
    timeEntries: [],
  };

  /**
   * Creates the ActivatedRoute mock used by the component.
   *
   * @returns ActivatedRoute test double.
   */
  function createRouteMock(): ActivatedRoute {
    return {
      snapshot: {
        paramMap: {
          get: (name: string): string | null => {
            if (name === 'id') {
              return routeParamId;
            }

            return null;
          },
        } as ParamMap,
      },
    } as ActivatedRoute;
  }

  /**
   * Creates the component through Angular TestBed.
   */
  function createComponent(): void {
    fixture = TestBed.createComponent(TicketDetailComponent);
    component = fixture.componentInstance;
  }

  /**
   * Configures the Angular testing module and all service spies.
   */
  beforeEach(async () => {
    routeParamId = '1';

    ticketServiceSpy = jasmine.createSpyObj<TicketService>('TicketService', [
      'getTicketDetails',
      'getTicket',
      'addComment',
      'getTimeEntries',
      'createTimeEntry',
      'assignTicket',
      'updateTicketStatus',
    ]);

    userServiceSpy = jasmine.createSpyObj<UserService>('UserService', [
      'getAgents',
    ]);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    ticketServiceSpy.getTicketDetails.and.returnValue(of(ticketDetails));
    ticketServiceSpy.getTicket.and.returnValue(of(ticket));
    ticketServiceSpy.addComment.and.returnValue(of(comment));
    ticketServiceSpy.getTimeEntries.and.returnValue(of([]));
    ticketServiceSpy.createTimeEntry.and.returnValue(of(timeEntry));
    ticketServiceSpy.assignTicket.and.returnValue(of(updatedTicket));
    ticketServiceSpy.updateTicketStatus.and.returnValue(of(updatedTicket));

    userServiceSpy.getAgents.and.returnValue(of([agent, secondAgent]));

    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useFactory: createRouteMock,
        },
        {
          provide: TicketService,
          useValue: ticketServiceSpy,
        },
        {
          provide: UserService,
          useValue: userServiceSpy,
        },
        {
          provide: Router,
          useValue: routerSpy,
        },
      ],
    }).compileComponents();
  });

  /**
   * Destroys the fixture after each test.
   */
  afterEach(() => {
    fixture?.destroy();
  });

  describe('component creation', () => {
    it('should create', () => {
      createComponent();

      expect(component).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should initialize the time-entry form', () => {
      createComponent();

      component.ngOnInit();

      expect(component.timeEntryWorkDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(component.timeEntryDuration).toBe('');
      expect(component.timeEntryDescription).toBe('');
    });

    it('should load the ticket and agents', () => {
      createComponent();

      component.ngOnInit();

      expect(ticketServiceSpy.getTicketDetails).toHaveBeenCalledWith(1);
      expect(userServiceSpy.getAgents).toHaveBeenCalled();
    });
  });

  describe('loadTicketFromRoute', () => {
    it('should reject a missing id', () => {
      createComponent();

      routeParamId = null;

      component['loadTicketFromRoute']();

      expect(component['ticketId']).toBe(0);
      expect(component.errorMessage).toBe('The ticket identifier is invalid.');
      expect(ticketServiceSpy.getTicketDetails).not.toHaveBeenCalled();
    });

    it('should reject a non-numeric id', () => {
      createComponent();

      routeParamId = 'abc';

      component['loadTicketFromRoute']();

      expect(component['ticketId']).toBe(0);
      expect(component.errorMessage).toBe('The ticket identifier is invalid.');
      expect(ticketServiceSpy.getTicketDetails).not.toHaveBeenCalled();
    });

    it('should reject zero', () => {
      createComponent();

      routeParamId = '0';

      component['loadTicketFromRoute']();

      expect(component['ticketId']).toBe(0);
      expect(component.errorMessage).toBe('The ticket identifier is invalid.');
      expect(ticketServiceSpy.getTicketDetails).not.toHaveBeenCalled();
    });

    it('should reject a negative id', () => {
      createComponent();

      routeParamId = '-1';

      component['loadTicketFromRoute']();

      expect(component['ticketId']).toBe(0);
      expect(component.errorMessage).toBe('The ticket identifier is invalid.');
      expect(ticketServiceSpy.getTicketDetails).not.toHaveBeenCalled();
    });

    it('should reject a decimal id', () => {
      createComponent();

      routeParamId = '1.5';

      component['loadTicketFromRoute']();

      expect(component['ticketId']).toBe(0);
      expect(component.errorMessage).toBe('The ticket identifier is invalid.');
      expect(ticketServiceSpy.getTicketDetails).not.toHaveBeenCalled();
    });

    it('should accept a valid positive integer id', () => {
      createComponent();

      routeParamId = '25';

      component['loadTicketFromRoute']();

      expect(component['ticketId']).toBe(25);
      expect(ticketServiceSpy.getTicketDetails).toHaveBeenCalledWith(25);
    });
  });

  describe('loadTicket', () => {
    it('should do nothing when ticketId is zero', () => {
      createComponent();

      component['ticketId'] = 0;

      component.loadTicket();

      expect(ticketServiceSpy.getTicketDetails).not.toHaveBeenCalled();
    });

    it('should load TicketDetailsResponse successfully', () => {
      createComponent();

      component['ticketId'] = 1;

      component.loadTicket();

      expect(component.ticket).toEqual(ticket);
      expect(component.comments).toEqual([]);
      expect(component.activities).toEqual([activity]);
      expect(component.timeEntries).toEqual([]);
      expect(component.selectedAgentId).toBe('agent-1');
      expect(component.selectedStatus).toBe(TicketStatus.Open);
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('');
    });

    it('should use the basic ticket endpoint when details loading fails', () => {
      createComponent();

      ticketServiceSpy.getTicketDetails.and.returnValue(
        throwError(() => ({
          status: 500,
        })),
      );

      ticketServiceSpy.getTicket.and.returnValue(of(ticket));

      component['ticketId'] = 1;
      component.loadTicket();

      expect(ticketServiceSpy.getTicketDetails).toHaveBeenCalledWith(1);
      expect(ticketServiceSpy.getTicket).toHaveBeenCalledWith(1);
      expect(component.ticket).toEqual(ticket);
      expect(component.isLoading).toBeFalse();
    });

    it('should display the session-expired message for a 401 error', () => {
      createComponent();

      ticketServiceSpy.getTicketDetails.and.returnValue(
        throwError(() => ({
          status: 401,
        })),
      );

      ticketServiceSpy.getTicket.and.returnValue(
        throwError(() => ({
          status: 401,
        })),
      );

      component['ticketId'] = 1;
      component.loadTicket();

      expect(component.errorMessage).toBe(
        'Your session has expired. Please sign in again.',
      );
      expect(component.isLoading).toBeFalse();
    });

    it('should display the forbidden message for a 403 error', () => {
      createComponent();

      ticketServiceSpy.getTicketDetails.and.returnValue(
        throwError(() => ({
          status: 403,
        })),
      );

      ticketServiceSpy.getTicket.and.returnValue(
        throwError(() => ({
          status: 403,
        })),
      );

      component['ticketId'] = 1;
      component.loadTicket();

      expect(component.errorMessage).toBe(
        'You do not have permission to view this ticket.',
      );
    });

    it('should display the not-found message for a 404 error', () => {
      createComponent();

      ticketServiceSpy.getTicketDetails.and.returnValue(
        throwError(() => ({
          status: 404,
        })),
      );

      ticketServiceSpy.getTicket.and.returnValue(
        throwError(() => ({
          status: 404,
        })),
      );

      component['ticketId'] = 1;
      component.loadTicket();

      expect(component.errorMessage).toBe(
        'The requested ticket could not be found.',
      );
    });

    it('should display the backend error detail when available', () => {
      createComponent();

      ticketServiceSpy.getTicketDetails.and.returnValue(
        throwError(() => ({
          status: 500,
        })),
      );

      ticketServiceSpy.getTicket.and.returnValue(
        throwError(() => ({
          status: 500,
          error: {
            detail: 'Database unavailable.',
          },
        })),
      );

      component['ticketId'] = 1;
      component.loadTicket();

      expect(component.errorMessage).toBe('Database unavailable.');
    });

    it('should use the fallback error message when no backend message exists', () => {
      createComponent();

      ticketServiceSpy.getTicketDetails.and.returnValue(
        throwError(() => ({
          status: 500,
        })),
      );

      ticketServiceSpy.getTicket.and.returnValue(
        throwError(() => ({
          status: 500,
          error: {},
        })),
      );

      component['ticketId'] = 1;
      component.loadTicket();

      expect(component.errorMessage).toBe(
        'Unable to load the requested ticket.',
      );
    });

    it('should clear previous load messages before loading', () => {
      createComponent();

      component.assignmentMessage = 'old assignment';
      component.statusMessage = 'old status';
      component.commentMessage = 'old comment';

      component['ticketId'] = 1;
      component.loadTicket();

      expect(component.assignmentMessage).toBe('');
      expect(component.statusMessage).toBe('');
      expect(component.commentMessage).toBe('');
    });
  });

  describe('isTicketDetailsResponse', () => {
    it('should return true for a details response', () => {
      createComponent();

      expect(component['isTicketDetailsResponse'](ticketDetails)).toBeTrue();
    });

    it('should return false for a ticket response', () => {
      createComponent();

      expect(component['isTicketDetailsResponse'](ticket)).toBeFalse();
    });
  });

  describe('addComment', () => {
    it('should do nothing when there is no ticket', () => {
      createComponent();

      component.ticket = null;
      component.newComment = 'Test comment';

      component.addComment();

      expect(ticketServiceSpy.addComment).not.toHaveBeenCalled();
    });

    it('should do nothing while another comment is being submitted', () => {
      createComponent();

      component.ticket = ticket;
      component.newComment = 'Test comment';
      component.isAddingComment = true;

      component.addComment();

      expect(ticketServiceSpy.addComment).not.toHaveBeenCalled();
    });

    it('should reject an empty comment', () => {
      createComponent();

      component.ticket = ticket;
      component.newComment = '   ';

      component.addComment();

      expect(component.commentMessage).toBe(
        'Please enter a comment before submitting.',
      );
      expect(ticketServiceSpy.addComment).not.toHaveBeenCalled();
    });

    it('should submit a valid comment', () => {
      createComponent();

      component.ticket = ticket;
      (component as any).ticketDetails = ticketDetails;
      component.newComment = '  Test comment  ';

      component.addComment();

      expect(ticketServiceSpy.addComment).toHaveBeenCalledWith(1, {
        content: 'Test comment',
      } as AddTicketCommentRequest);

      expect(component.newComment).toBe('');
      expect(component.commentMessage).toBe('Comment added successfully.');
      expect(component.isAddingComment).toBeFalse();
      expect(component.comments).toContain(comment);
    });

    it('should reject an invalid ticket identifier', () => {
      createComponent();

      component.ticket = {
        ...ticket,
        id: 0,
      };

      component.newComment = 'Test comment';

      component.addComment();

      expect(component.commentMessage).toBe(
        'The ticket identifier is invalid. Please reload the page.',
      );
      expect(ticketServiceSpy.addComment).not.toHaveBeenCalled();
    });

    it('should handle a 400 comment error', () => {
      createComponent();

      ticketServiceSpy.addComment.and.returnValue(
        throwError(() => ({
          status: 400,
          error: {
            detail: 'Comment content is invalid.',
          },
        })),
      );

      component.ticket = ticket;
      component.newComment = 'Test comment';

      component.addComment();

      expect(component.commentMessage).toBe('Comment content is invalid.');
      expect(component.isAddingComment).toBeFalse();
    });

    it('should handle a 401 comment error', () => {
      createComponent();

      ticketServiceSpy.addComment.and.returnValue(
        throwError(() => ({
          status: 401,
        })),
      );

      component.ticket = ticket;
      component.newComment = 'Test comment';

      component.addComment();

      expect(component.commentMessage).toBe(
        'Your session has expired. Please sign in again.',
      );
      expect(component.isAddingComment).toBeFalse();
    });

    it('should handle a 403 comment error', () => {
      createComponent();

      ticketServiceSpy.addComment.and.returnValue(
        throwError(() => ({
          status: 403,
        })),
      );

      component.ticket = ticket;
      component.newComment = 'Test comment';

      component.addComment();

      expect(component.commentMessage).toBe(
        'You do not have permission to comment on this ticket.',
      );
      expect(component.isAddingComment).toBeFalse();
    });

    it('should handle a 404 comment error', () => {
      createComponent();

      ticketServiceSpy.addComment.and.returnValue(
        throwError(() => ({
          status: 404,
        })),
      );

      component.ticket = ticket;
      component.newComment = 'Test comment';

      component.addComment();

      expect(component.commentMessage).toBe(
        'The requested ticket could not be found.',
      );
      expect(component.isAddingComment).toBeFalse();
    });

    it('should handle an unknown comment error', () => {
      createComponent();

      ticketServiceSpy.addComment.and.returnValue(
        throwError(() => ({
          status: 500,
          error: {},
        })),
      );

      component.ticket = ticket;
      component.newComment = 'Test comment';

      component.addComment();

      expect(component.commentMessage).toBe(
        'Unable to add the comment. Please try again.',
      );
      expect(component.isAddingComment).toBeFalse();
    });
  });

  describe('addTimeEntry', () => {
    beforeEach(() => {
      createComponent();

      component.ticket = ticket;
      (component as any).ticketDetails = ticketDetails;
      component.timeEntryWorkDate = '2026-08-28';
      component.timeEntryDuration = '01:30';
      component.timeEntryDescription = 'Investigated printer issue.';
    });

    it('should submit a valid time entry', () => {
      component.addTimeEntry();

      expect(ticketServiceSpy.createTimeEntry).toHaveBeenCalledWith(1, {
        workDate: '2026-08-28',
        duration: '01:30:00',
        description: 'Investigated printer issue.',
      } as CreateTimeEntryRequest);

      expect(component.timeEntryDuration).toBe('');
      expect(component.timeEntryDescription).toBe('');
      expect(component.timeEntryMessage).toBe(
        'Work time recorded successfully.',
      );
    });

    it('should reject an empty work date', () => {
      component.timeEntryWorkDate = '';

      component.addTimeEntry();

      expect(component.timeEntryMessage).toBe(
        'Please select the date when the work was done.',
      );
      expect(ticketServiceSpy.createTimeEntry).not.toHaveBeenCalled();
    });

    it('should reject an empty duration', () => {
      component.timeEntryDuration = '';

      component.addTimeEntry();

      expect(component.timeEntryMessage).toBe(
        'Please enter the amount of time worked.',
      );
      expect(ticketServiceSpy.createTimeEntry).not.toHaveBeenCalled();
    });

    it('should reject an invalid duration', () => {
      component.timeEntryDuration = '25:00';

      component.addTimeEntry();

      expect(component.timeEntryMessage).toBe(
        'Enter a valid duration between 00:01 and 24:00.',
      );
      expect(ticketServiceSpy.createTimeEntry).not.toHaveBeenCalled();
    });

    it('should reject zero duration', () => {
      component.timeEntryDuration = '00:00';

      component.addTimeEntry();

      expect(component.timeEntryMessage).toBe(
        'Enter a valid duration between 00:01 and 24:00.',
      );
      expect(ticketServiceSpy.createTimeEntry).not.toHaveBeenCalled();
    });

    it('should reject 24 hours with non-zero minutes', () => {
      component.timeEntryDuration = '24:01';

      component.addTimeEntry();

      expect(component.timeEntryMessage).toBe(
        'Enter a valid duration between 00:01 and 24:00.',
      );
      expect(ticketServiceSpy.createTimeEntry).not.toHaveBeenCalled();
    });

    it('should accept exactly 24 hours', () => {
      component.timeEntryDuration = '24:00';

      component.addTimeEntry();

      expect(ticketServiceSpy.createTimeEntry).toHaveBeenCalledWith(
        1,
        jasmine.objectContaining({
          duration: '24:00:00',
        }),
      );
    });

    it('should reject an empty description', () => {
      component.timeEntryDescription = '';

      component.addTimeEntry();

      expect(component.timeEntryMessage).toBe(
        'Please describe the work performed.',
      );
      expect(ticketServiceSpy.createTimeEntry).not.toHaveBeenCalled();
    });

    it('should reject a description longer than 2000 characters', () => {
      component.timeEntryDescription = 'x'.repeat(2001);

      component.addTimeEntry();

      expect(component.timeEntryMessage).toBe(
        'The work description cannot exceed 2000 characters.',
      );
      expect(ticketServiceSpy.createTimeEntry).not.toHaveBeenCalled();
    });

    it('should trim the description before submission', () => {
      component.timeEntryDescription = '  Investigated printer issue.  ';

      component.addTimeEntry();

      expect(ticketServiceSpy.createTimeEntry).toHaveBeenCalledWith(
        1,
        jasmine.objectContaining({
          description: 'Investigated printer issue.',
        }),
      );
    });

    it('should reject an invalid ticket identifier', () => {
      component.ticket = {
        ...ticket,
        id: 0,
      };

      component.addTimeEntry();

      expect(component.timeEntryMessage).toBe(
        'The ticket identifier is invalid. Please reload the page.',
      );
      expect(ticketServiceSpy.createTimeEntry).not.toHaveBeenCalled();
    });

    it('should handle a 400 error', () => {
      ticketServiceSpy.createTimeEntry.and.returnValue(
        throwError(() => ({
          status: 400,
          error: {
            detail: 'Invalid time entry.',
          },
        })),
      );

      component.addTimeEntry();

      expect(component.timeEntryMessage).toBe('Invalid time entry.');
      expect(component.isAddingTimeEntry).toBeFalse();
    });

    it('should handle a 401 error', () => {
      ticketServiceSpy.createTimeEntry.and.returnValue(
        throwError(() => ({
          status: 401,
        })),
      );

      component.addTimeEntry();

      expect(component.timeEntryMessage).toBe(
        'Your session has expired. Please sign in again.',
      );
      expect(component.isAddingTimeEntry).toBeFalse();
    });

    it('should handle a 403 error', () => {
      ticketServiceSpy.createTimeEntry.and.returnValue(
        throwError(() => ({
          status: 403,
        })),
      );

      component.addTimeEntry();

      expect(component.timeEntryMessage).toBe(
        'You do not have permission to record work against this ticket.',
      );
      expect(component.isAddingTimeEntry).toBeFalse();
    });

    it('should handle a 404 error', () => {
      ticketServiceSpy.createTimeEntry.and.returnValue(
        throwError(() => ({
          status: 404,
        })),
      );

      component.addTimeEntry();

      expect(component.timeEntryMessage).toBe(
        'The requested ticket could not be found.',
      );
      expect(component.isAddingTimeEntry).toBeFalse();
    });
  });

  describe('loadAgents', () => {
    it('should load agents successfully', () => {
      createComponent();

      component.loadAgents();

      expect(component.agents).toEqual([agent, secondAgent]);
      expect(component.isLoadingAgents).toBeFalse();
    });

    it('should use an empty collection when the API returns null', () => {
      createComponent();

      userServiceSpy.getAgents.and.returnValue(
        of(null as unknown as UserResponse[]),
      );

      component.loadAgents();

      expect(component.agents).toEqual([]);
      expect(component.isLoadingAgents).toBeFalse();
    });

    it('should clear agents when loading fails', () => {
      createComponent();

      component.agents = [agent];

      userServiceSpy.getAgents.and.returnValue(
        throwError(() => new Error('Unable to load agents')),
      );

      component.loadAgents();

      expect(component.agents).toEqual([]);
      expect(component.isLoadingAgents).toBeFalse();
    });
  });

  describe('assignTicket', () => {
    it('should do nothing when there is no ticket', () => {
      createComponent();

      component.ticket = null;
      component.selectedAgentId = 'agent-1';

      component.assignTicket();

      expect(ticketServiceSpy.assignTicket).not.toHaveBeenCalled();
    });

    it('should do nothing when no agent is selected', () => {
      createComponent();

      component.ticket = ticket;
      component.selectedAgentId = '';

      component.assignTicket();

      expect(ticketServiceSpy.assignTicket).not.toHaveBeenCalled();
    });

    it('should assign the ticket successfully', () => {
      createComponent();

      component.ticket = ticket;
      component.selectedAgentId = 'agent-2';

      component.assignTicket();

      expect(ticketServiceSpy.assignTicket).toHaveBeenCalledWith(1, {
        agentId: 'agent-2',
      } as AssignTicketRequest);

      expect(component.ticket).toEqual(updatedTicket);
      expect(component.selectedAgentId).toBe('agent-2');
      expect(component.assignmentMessage).toBe(
        'Ticket assignment updated successfully.',
      );
      expect(component.isAssigning).toBeFalse();
    });

    it('should reject an invalid ticket identifier', () => {
      createComponent();

      component.ticket = {
        ...ticket,
        id: 0,
      };
      component.selectedAgentId = 'agent-2';

      component.assignTicket();

      expect(component.assignmentMessage).toBe(
        'The ticket identifier is invalid. Please reload the page.',
      );
      expect(ticketServiceSpy.assignTicket).not.toHaveBeenCalled();
    });

    it('should handle a 400 assignment error', () => {
      createComponent();

      ticketServiceSpy.assignTicket.and.returnValue(
        throwError(() => ({
          status: 400,
          error: {
            detail: 'Invalid agent.',
          },
        })),
      );

      component.ticket = ticket;
      component.selectedAgentId = 'agent-2';

      component.assignTicket();

      expect(component.assignmentMessage).toBe('Invalid agent.');
      expect(component.isAssigning).toBeFalse();
    });

    it('should handle a 404 assignment error', () => {
      createComponent();

      ticketServiceSpy.assignTicket.and.returnValue(
        throwError(() => ({
          status: 404,
        })),
      );

      component.ticket = ticket;
      component.selectedAgentId = 'agent-2';

      component.assignTicket();

      expect(component.assignmentMessage).toBe(
        'The ticket or selected support agent could not be found.',
      );
      expect(component.isAssigning).toBeFalse();
    });

    it('should handle a 403 assignment error', () => {
      createComponent();

      ticketServiceSpy.assignTicket.and.returnValue(
        throwError(() => ({
          status: 403,
        })),
      );

      component.ticket = ticket;
      component.selectedAgentId = 'agent-2';

      component.assignTicket();

      expect(component.assignmentMessage).toBe(
        'You do not have permission to assign this ticket.',
      );
      expect(component.isAssigning).toBeFalse();
    });
  });

  describe('updateStatus', () => {
    it('should do nothing when there is no ticket', () => {
      createComponent();

      component.ticket = null;
      component.selectedStatus = TicketStatus.InProgress;

      component.updateStatus();

      expect(ticketServiceSpy.updateTicketStatus).not.toHaveBeenCalled();
    });

    it('should do nothing when no status is selected', () => {
      createComponent();

      component.ticket = ticket;
      component.selectedStatus = null;

      component.updateStatus();

      expect(ticketServiceSpy.updateTicketStatus).not.toHaveBeenCalled();
    });

    it('should do nothing when the selected status is unchanged', () => {
      createComponent();

      component.ticket = ticket;
      component.selectedStatus = TicketStatus.Open;

      component.updateStatus();

      expect(ticketServiceSpy.updateTicketStatus).not.toHaveBeenCalled();
    });

    it('should update the status successfully', () => {
      createComponent();

      component.ticket = ticket;
      component.selectedStatus = TicketStatus.InProgress;

      component.updateStatus();

      expect(ticketServiceSpy.updateTicketStatus).toHaveBeenCalledWith(1, {
        status: TicketStatus.InProgress,
      } as UpdateTicketStatusRequest);

      expect(component.ticket).toEqual(updatedTicket);
      expect(component.selectedStatus).toBe(TicketStatus.InProgress);
      expect(component.statusMessage).toBe(
        'Ticket status updated successfully.',
      );
      expect(component.isUpdatingStatus).toBeFalse();
    });

    it('should reject an invalid ticket identifier', () => {
      createComponent();

      component.ticket = {
        ...ticket,
        id: 0,
      };
      component.selectedStatus = TicketStatus.InProgress;

      component.updateStatus();

      expect(component.statusMessage).toBe(
        'The ticket identifier is invalid. Please reload the page.',
      );
      expect(ticketServiceSpy.updateTicketStatus).not.toHaveBeenCalled();
    });

    it('should handle a status update error', () => {
      createComponent();

      ticketServiceSpy.updateTicketStatus.and.returnValue(
        throwError(() => ({
          status: 400,
          error: {
            detail: 'Invalid status transition.',
          },
        })),
      );

      component.ticket = ticket;
      component.selectedStatus = TicketStatus.InProgress;

      component.updateStatus();

      expect(component.statusMessage).toBe('Invalid status transition.');
      expect(component.isUpdatingStatus).toBeFalse();
    });
  });

  describe('goBack', () => {
    it('should navigate to the ticket list', () => {
      createComponent();

      component.goBack();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/tickets']);
    });
  });

  describe('status and priority labels', () => {
    it('should return the correct status label', () => {
      createComponent();

      expect(component.getStatusLabel(TicketStatus.Open)).toBe('Open');
      expect(component.getStatusLabel(TicketStatus.InProgress)).toBe(
        'In Progress',
      );
      expect(component.getStatusLabel(TicketStatus.Resolved)).toBe('Resolved');
      expect(component.getStatusLabel(TicketStatus.Closed)).toBe('Closed');
    });

    it('should return the correct priority labels', () => {
      createComponent();

      expect(component.getPriorityLabel(TicketPriority.Low)).toBe('Low');
      expect(component.getPriorityLabel(TicketPriority.Medium)).toBe('Medium');
      expect(component.getPriorityLabel(TicketPriority.High)).toBe('High');
      expect(component.getPriorityLabel(TicketPriority.Critical)).toBe(
        'Critical',
      );
    });
  });

  describe('getStatusClass', () => {
    it('should return the open class', () => {
      createComponent();

      expect(component.getStatusClass(TicketStatus.Open)).toBe('status-open');
    });

    it('should return the progress class', () => {
      createComponent();

      expect(component.getStatusClass(TicketStatus.InProgress)).toBe(
        'status-progress',
      );
    });

    it('should return the resolved class', () => {
      createComponent();

      expect(component.getStatusClass(TicketStatus.Resolved)).toBe(
        'status-resolved',
      );
    });

    it('should return the closed class', () => {
      createComponent();

      expect(component.getStatusClass(TicketStatus.Closed)).toBe(
        'status-closed',
      );
    });

    it('should return an empty class for an unknown value', () => {
      createComponent();

      expect(component.getStatusClass(999 as TicketStatus)).toBe('');
    });
  });

  describe('getPriorityClass', () => {
    it('should return the low class', () => {
      createComponent();

      expect(component.getPriorityClass(TicketPriority.Low)).toBe(
        'priority-low',
      );
    });

    it('should return the medium class', () => {
      createComponent();

      expect(component.getPriorityClass(TicketPriority.Medium)).toBe(
        'priority-medium',
      );
    });

    it('should return the high class', () => {
      createComponent();

      expect(component.getPriorityClass(TicketPriority.High)).toBe(
        'priority-high',
      );
    });

    it('should return the critical class', () => {
      createComponent();

      expect(component.getPriorityClass(TicketPriority.Critical)).toBe(
        'priority-critical',
      );
    });

    it('should return an empty class for an unknown value', () => {
      createComponent();

      expect(component.getPriorityClass(999 as TicketPriority)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('should return a dash for an empty value', () => {
      createComponent();

      expect(component.formatDate()).toBe('-');
    });

    it('should return a dash for an empty string', () => {
      createComponent();

      expect(component.formatDate('')).toBe('-');
    });

    it('should format a valid ISO date', () => {
      createComponent();

      expect(component.formatDate('2026-08-28T13:30:00Z')).toContain(
        'Aug 28, 2026',
      );
    });

    it('should return the original value for an invalid date', () => {
      createComponent();

      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });
  });

  describe('formatWorkDate', () => {
    it('should return a dash for an empty value', () => {
      createComponent();

      expect(component.formatWorkDate()).toBe('-');
    });

    it('should format a date without applying an unwanted timezone shift', () => {
      createComponent();

      expect(component.formatWorkDate('2026-08-28')).toBe('Aug 28, 2026');
    });

    it('should format a date-time using the date portion', () => {
      createComponent();

      expect(component.formatWorkDate('2026-08-28T23:59:59Z')).toBe(
        'Aug 28, 2026',
      );
    });

    it('should return the original value when the date structure is invalid', () => {
      createComponent();

      expect(component.formatWorkDate('invalid')).toBe('invalid');
    });
  });

  describe('formatWorkTime', () => {
    it('should return 0m for an empty value', () => {
      createComponent();

      expect(component.formatWorkTime()).toBe('0m');
    });

    it('should format hours and minutes', () => {
      createComponent();

      expect(component.formatWorkTime('01:30:00')).toBe('1h 30m');
    });

    it('should format days, hours and minutes', () => {
      createComponent();

      expect(component.formatWorkTime('1.02:15:00')).toBe('1d 2h 15m');
    });

    it('should format minutes only', () => {
      createComponent();

      expect(component.formatWorkTime('00:45:00')).toBe('45m');
    });

    it('should return 0m when the duration contains only zero values', () => {
      createComponent();

      expect(component.formatWorkTime('00:00:00')).toBe('0m');
    });

    it('should support the HH:mm format', () => {
      createComponent();

      expect(component.formatWorkTime('02:30')).toBe('2h 30m');
    });

    it('should return an unsupported format unchanged', () => {
      createComponent();

      expect(component.formatWorkTime('invalid')).toBe('invalid');
    });
  });

  describe('getAgentName', () => {
    it('should return the full agent name', () => {
      createComponent();

      expect(component.getAgentName(agent)).toBe('Jane Agent');
    });

    it('should trim the resulting name', () => {
      createComponent();

      const partialAgent = {
        ...agent,
        firstName: '',
      };

      expect(component.getAgentName(partialAgent)).toBe('Agent');
    });
  });

  describe('getAgentInitial', () => {
    it('should return the first letter of the agent name', () => {
      createComponent();

      expect(component.getAgentInitial(agent)).toBe('J');
    });

    it('should return an empty string for an agent without a name', () => {
      createComponent();

      const unnamedAgent = {
        ...agent,
        firstName: '',
        lastName: '',
      };

      expect(component.getAgentInitial(unnamedAgent)).toBe('');
    });
  });

  describe('computed collections', () => {
    it('should return an empty comments collection when details are unavailable', () => {
      createComponent();

      expect(component.comments).toEqual([]);
    });

    it('should return comments from the details response', () => {
      createComponent();

      (component as any).ticketDetails = {
        ...ticketDetails,
        comments: [comment],
      };

      expect(component.comments).toEqual([comment]);
    });

    it('should return activities from the details response', () => {
      createComponent();

      expect(component.activities).toEqual([]);

      (component as any).ticketDetails = ticketDetails;

      expect(component.activities).toEqual([activity]);
    });

    it('should return time entries from the details response', () => {
      createComponent();

      (component as any).ticketDetails = {
        ...ticketDetails,
        timeEntries: [timeEntry],
      };

      expect(component.timeEntries).toEqual([timeEntry]);
    });
  });

  describe('private duration validation', () => {
    it('should accept 00:01', () => {
      createComponent();

      expect(component['isValidDuration']('00:01')).toBeTrue();
    });

    it('should accept 01:00', () => {
      createComponent();

      expect(component['isValidDuration']('01:00')).toBeTrue();
    });

    it('should accept 24:00', () => {
      createComponent();

      expect(component['isValidDuration']('24:00')).toBeTrue();
    });

    it('should reject 00:00', () => {
      createComponent();

      expect(component['isValidDuration']('00:00')).toBeFalse();
    });

    it('should reject 24:01', () => {
      createComponent();

      expect(component['isValidDuration']('24:01')).toBeFalse();
    });

    it('should reject 25:00', () => {
      createComponent();

      expect(component['isValidDuration']('25:00')).toBeFalse();
    });

    it('should reject invalid text', () => {
      createComponent();

      expect(component['isValidDuration']('abc')).toBeFalse();
    });

    it('should reject malformed minutes', () => {
      createComponent();

      expect(component['isValidDuration']('01:60')).toBeFalse();
    });
  });

  describe('private toApiDuration', () => {
    it('should convert one hour and thirty minutes', () => {
      createComponent();

      expect(component['toApiDuration']('1:30')).toBe('01:30:00');
    });

    it('should preserve zero padding', () => {
      createComponent();

      expect(component['toApiDuration']('01:05')).toBe('01:05:00');
    });

    it('should convert 24 hours correctly', () => {
      createComponent();

      expect(component['toApiDuration']('24:00')).toBe('24:00:00');
    });
  });

  describe('private getTodayDate', () => {
    it('should return the current date in YYYY-MM-DD format', () => {
      createComponent();

      const result = component['getTodayDate']();

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('refreshTicketDetailsAfterTimeEntry', () => {
    it('should do nothing when ticketId is zero', () => {
      createComponent();

      component['ticketId'] = 0;

      component['refreshTicketDetailsAfterTimeEntry']();

      expect(ticketServiceSpy.getTicketDetails).not.toHaveBeenCalled();
    });

    it('should refresh ticket details after successful time entry creation', () => {
      createComponent();

      component['ticketId'] = 1;
      component['refreshTicketDetailsAfterTimeEntry']();

      expect(ticketServiceSpy.getTicketDetails).toHaveBeenCalledWith(1);
      expect(component.ticket).toEqual(ticket);
      expect((component as any).ticketDetails).toEqual(ticketDetails);
      expect(component.isAddingTimeEntry).toBeFalse();
      expect(component.timeEntryMessage).toBe(
        'Work time recorded successfully.',
      );
    });

    it('should preserve the successful operation message when refresh fails', () => {
      createComponent();

      ticketServiceSpy.getTicketDetails.and.returnValue(
        throwError(() => ({
          status: 500,
        })),
      );

      component['ticketId'] = 1;
      component.isAddingTimeEntry = true;
      component['refreshTicketDetailsAfterTimeEntry']();

      expect(component.isAddingTimeEntry).toBeFalse();
      expect(component.timeEntryMessage).toBe(
        'Work time recorded successfully.',
      );
    });
  });
});
