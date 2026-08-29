import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { TicketsComponent } from './tickets.component';
import { TicketService } from '../../core/services/ticket.service';
import { AuthService } from '../../core/services/auth.service';
import {
  TicketPriority,
  TicketQueryRequest,
  TicketQueryResponse,
  TicketResponse,
  TicketStatus,
} from '../../models/ticket.models';

describe('TicketsComponent', () => {
  let component: TicketsComponent;
  let fixture: ComponentFixture<TicketsComponent>;
  let ticketServiceSpy: jasmine.SpyObj<TicketService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const ticket: TicketResponse = {
    id: 1,
    title: 'Unable to access account',
    description: 'Customer cannot access the account.',
    priority: TicketPriority.High,
    status: TicketStatus.Open,
    customerId: '10',
    customerName: 'John Customer',
    assignedAgentId: '20',
    assignedAgentName: 'Jane Agent',
    createdAt: '2026-08-28T10:30:00Z',
    updatedAt: '2026-08-28T12:00:00Z',
    totalWorkTime: '01:30:00',
  };

  const secondTicket: TicketResponse = {
    id: 2,
    title: 'Password reset required',
    description: 'Customer needs a password reset.',
    priority: TicketPriority.Medium,
    status: TicketStatus.InProgress,
    customerId: '11',
    customerName: 'Alice Customer',
    assignedAgentId: '21',
    assignedAgentName: 'Bob Agent',
    createdAt: '2026-08-27T10:30:00Z',
    updatedAt: '2026-08-27T12:00:00Z',
    totalWorkTime: '02:15:00',
  };

  const createResponse = (
    overrides: Partial<TicketQueryResponse> = {},
  ): TicketQueryResponse => ({
    items: [ticket],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 20,
    totalPages: 1,
    ...overrides,
  });

  beforeEach(async () => {
    ticketServiceSpy = jasmine.createSpyObj<TicketService>('TicketService', [
      'getTickets',
    ]);

    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'getStoredCurrentUser',
    ]);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    authServiceSpy.getStoredCurrentUser.and.returnValue({
      userId: '1',
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      email: 'test@example.com',
      role: 'Customer',
    });

    ticketServiceSpy.getTickets.and.returnValue(of(createResponse()));

    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, TicketsComponent],
      providers: [
        {
          provide: TicketService,
          useValue: ticketServiceSpy,
        },
        {
          provide: AuthService,
          useValue: authServiceSpy,
        },
        {
          provide: Router,
          useValue: routerSpy,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketsComponent);
    component = fixture.componentInstance;
  });

  describe('component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with the expected default values', () => {
      expect(component.tickets).toEqual([]);
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.totalCount).toBe(0);
      expect(component.pageNumber).toBe(1);
      expect(component.pageSize).toBe(20);
      expect(component.totalPages).toBe(0);
      expect(component.search).toBe('');
      expect(component.selectedStatus).toBeNull();
      expect(component.selectedPriority).toBeNull();
      expect(component.sortBy).toBe('CreatedAt');
      expect(component.sortDescending).toBeTrue();
    });
  });

  describe('ngOnInit', () => {
    it('should load tickets when initialized', () => {
      spyOn(component, 'loadTickets');

      component.ngOnInit();

      expect(component.loadTickets).toHaveBeenCalled();
    });
  });

  describe('canCreateTicket', () => {
    it('should return true for an administrator', () => {
      authServiceSpy.getStoredCurrentUser.and.returnValue({
        userId: '1',
        firstName: 'Admin',
        lastName: 'User',
        fullName: 'Admin User',
        email: '[admin@example.com](mailto:admin@example.com)',
        role: 'Admin',
      });

      expect(component.canCreateTicket).toBeTrue();
    });

    it('should return true for a customer', () => {
      authServiceSpy.getStoredCurrentUser.and.returnValue({
        userId: '1',
        firstName: 'Customer',
        lastName: 'User',
        fullName: 'Customer User',
        email: 'customer@example.com',
        role: 'Customer',
      });

      expect(component.canCreateTicket).toBeTrue();
    });

    it('should return false for a support agent', () => {
      authServiceSpy.getStoredCurrentUser.and.returnValue({
        userId: '1',
        firstName: 'Agent',
        lastName: 'User',
        fullName: 'Agent User',
        email: 'agent@example.com',
        role: 'Support Agent',
      });

      expect(component.canCreateTicket).toBeFalse();
    });

    it('should return false when no authenticated user exists', () => {
      authServiceSpy.getStoredCurrentUser.and.returnValue(null);

      expect(component.canCreateTicket).toBeFalse();
    });

    it('should handle role values without case sensitivity', () => {
      authServiceSpy.getStoredCurrentUser.and.returnValue({
        userId: '1',
        firstName: 'Admin',
        lastName: 'User',
        fullName: 'Admin User',
        email: 'admin@example.com',
        role: '  ADMIN  ',
      });

      expect(component.canCreateTicket).toBeTrue();
    });

    it('should return false for an unknown role', () => {
      authServiceSpy.getStoredCurrentUser.and.returnValue({
        userId: '1',
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'Manager',
      });

      expect(component.canCreateTicket).toBeFalse();
    });
  });

  describe('loadTickets', () => {
    it('should load tickets successfully', () => {
      ticketServiceSpy.getTickets.and.returnValue(
        of(
          createResponse({
            items: [ticket, secondTicket],
            totalCount: 2,
            pageNumber: 1,
            pageSize: 20,
            totalPages: 1,
          }),
        ),
      );

      component.loadTickets();

      expect(ticketServiceSpy.getTickets).toHaveBeenCalledTimes(1);
      expect(component.tickets).toEqual([ticket, secondTicket]);
      expect(component.totalCount).toBe(2);
      expect(component.pageNumber).toBe(1);
      expect(component.pageSize).toBe(20);
      expect(component.totalPages).toBe(1);
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('');
    });

    it('should send the current filters and sorting options to the service', () => {
      component.search = 'account';
      component.selectedStatus = TicketStatus.Open;
      component.selectedPriority = TicketPriority.High;
      component.pageNumber = 2;
      component.pageSize = 10;
      component.sortBy = 'UpdatedAt';
      component.sortDescending = false;

      component.loadTickets();

      const request = ticketServiceSpy.getTickets.calls.mostRecent()
        .args[0] as TicketQueryRequest;

      expect(request).toEqual({
        pageNumber: 2,
        pageSize: 10,
        search: 'account',
        status: TicketStatus.Open,
        priority: TicketPriority.High,
        sortBy: 'UpdatedAt',
        sortDescending: false,
      });
    });

    it('should trim the search value before sending it', () => {
      component.search = '  account  ';

      component.loadTickets();

      const request = ticketServiceSpy.getTickets.calls.mostRecent()
        .args[0] as TicketQueryRequest;

      expect(request.search).toBe('account');
    });

    it('should send undefined for an empty search value', () => {
      component.search = '   ';

      component.loadTickets();

      const request = ticketServiceSpy.getTickets.calls.mostRecent()
        .args[0] as TicketQueryRequest;

      expect(request.search).toBeUndefined();
    });

    it('should send undefined when status is not selected', () => {
      component.selectedStatus = null;

      component.loadTickets();

      const request = ticketServiceSpy.getTickets.calls.mostRecent()
        .args[0] as TicketQueryRequest;

      expect(request.status).toBeUndefined();
    });

    it('should send undefined when priority is not selected', () => {
      component.selectedPriority = null;

      component.loadTickets();

      const request = ticketServiceSpy.getTickets.calls.mostRecent()
        .args[0] as TicketQueryRequest;

      expect(request.priority).toBeUndefined();
    });

    it('should handle a response with no items', () => {
      ticketServiceSpy.getTickets.and.returnValue(
        of(
          createResponse({
            items: [],
            totalCount: 0,
            pageNumber: 1,
            pageSize: 20,
            totalPages: 0,
          }),
        ),
      );

      component.loadTickets();

      expect(component.tickets).toEqual([]);
      expect(component.totalCount).toBe(0);
      expect(component.totalPages).toBe(0);
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('');
    });

    it('should prevent concurrent loads while already loading', () => {
      component.isLoading = true;

      component.loadTickets();

      expect(ticketServiceSpy.getTickets).not.toHaveBeenCalled();
    });

    it('should clear a previous error before loading', () => {
      component.errorMessage = 'Previous error';

      component.loadTickets();

      expect(component.errorMessage).toBe('');
    });

    it('should handle a 401 response', () => {
      ticketServiceSpy.getTickets.and.returnValue(
        throwError(() => ({
          status: 401,
        })),
      );

      component.loadTickets();

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe(
        'Your session has expired. Please sign in again.',
      );
    });

    it('should handle a 403 response', () => {
      ticketServiceSpy.getTickets.and.returnValue(
        throwError(() => ({
          status: 403,
        })),
      );

      component.loadTickets();

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe(
        'You do not have permission to view these tickets.',
      );
    });

    it('should use the API detail when a general API error occurs', () => {
      ticketServiceSpy.getTickets.and.returnValue(
        throwError(() => ({
          status: 500,
          error: {
            detail: 'Server failed to load tickets.',
          },
        })),
      );

      component.loadTickets();

      expect(component.errorMessage).toBe('Server failed to load tickets.');
      expect(component.isLoading).toBeFalse();
    });

    it('should use the API message when detail is unavailable', () => {
      ticketServiceSpy.getTickets.and.returnValue(
        throwError(() => ({
          status: 500,
          error: {
            message: 'Ticket service unavailable.',
          },
        })),
      );

      component.loadTickets();

      expect(component.errorMessage).toBe('Ticket service unavailable.');
    });

    it('should use the API title when detail and message are unavailable', () => {
      ticketServiceSpy.getTickets.and.returnValue(
        throwError(() => ({
          status: 500,
          error: {
            title: 'Internal Server Error',
          },
        })),
      );

      component.loadTickets();

      expect(component.errorMessage).toBe('Internal Server Error');
    });

    it('should use the default error message when no API message exists', () => {
      ticketServiceSpy.getTickets.and.returnValue(
        throwError(() => ({
          status: 500,
          error: {},
        })),
      );

      component.loadTickets();

      expect(component.errorMessage).toBe(
        'Unable to load tickets. Please try again.',
      );
    });

    it('should update pagination values from the API response', () => {
      ticketServiceSpy.getTickets.and.returnValue(
        of(
          createResponse({
            items: [ticket],
            totalCount: 47,
            pageNumber: 3,
            pageSize: 20,
            totalPages: 3,
          }),
        ),
      );

      component.pageNumber = 2;

      component.loadTickets();

      expect(component.pageNumber).toBe(3);
      expect(component.pageSize).toBe(20);
      expect(component.totalCount).toBe(47);
      expect(component.totalPages).toBe(3);
    });
  });

  describe('applyFilters', () => {
    it('should reset to the first page and load tickets', () => {
      component.pageNumber = 4;
      spyOn(component, 'loadTickets');

      component.applyFilters();

      expect(component.pageNumber).toBe(1);
      expect(component.loadTickets).toHaveBeenCalled();
    });
  });

  describe('clearFilters', () => {
    it('should clear all filters and reset to the first page', () => {
      component.search = 'account';
      component.selectedStatus = TicketStatus.Open;
      component.selectedPriority = TicketPriority.High;
      component.pageNumber = 4;

      spyOn(component, 'loadTickets');

      component.clearFilters();

      expect(component.search).toBe('');
      expect(component.selectedStatus).toBeNull();
      expect(component.selectedPriority).toBeNull();
      expect(component.pageNumber).toBe(1);
      expect(component.loadTickets).toHaveBeenCalled();
    });
  });

  describe('changeSort', () => {
    it('should change the sort property and reload tickets', () => {
      component.sortBy = 'CreatedAt';
      component.pageNumber = 3;

      spyOn(component, 'loadTickets');

      component.changeSort('Title');

      expect(component.sortBy).toBe('Title');
      expect(component.pageNumber).toBe(1);
      expect(component.loadTickets).toHaveBeenCalled();
    });

    it('should ignore an empty sort value', () => {
      component.sortBy = 'CreatedAt';

      spyOn(component, 'loadTickets');

      component.changeSort('');

      expect(component.sortBy).toBe('CreatedAt');
      expect(component.loadTickets).not.toHaveBeenCalled();
    });
  });

  describe('toggleSortDirection', () => {
    it('should toggle descending to ascending', () => {
      component.sortDescending = true;
      component.pageNumber = 3;

      spyOn(component, 'loadTickets');

      component.toggleSortDirection();

      expect(component.sortDescending).toBeFalse();
      expect(component.pageNumber).toBe(1);
      expect(component.loadTickets).toHaveBeenCalled();
    });

    it('should toggle ascending to descending', () => {
      component.sortDescending = false;

      spyOn(component, 'loadTickets');

      component.toggleSortDirection();

      expect(component.sortDescending).toBeTrue();
      expect(component.loadTickets).toHaveBeenCalled();
    });
  });

  describe('openTicket', () => {
    it('should navigate to a valid ticket', () => {
      component.openTicket(ticket);

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/tickets', ticket.id]);
    });

    it('should ignore a null ticket', () => {
      component.openTicket(null as unknown as TicketResponse);

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should ignore a ticket with an invalid id', () => {
      component.openTicket({
        ...ticket,
        id: 0,
      });

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should ignore a ticket with a negative id', () => {
      component.openTicket({
        ...ticket,
        id: -1,
      });

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should ignore a ticket with a non-finite id', () => {
      component.openTicket({
        ...ticket,
        id: Number.NaN,
      });

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('goToPage', () => {
    beforeEach(() => {
      component.pageNumber = 1;
      component.totalPages = 5;
    });

    it('should navigate to a valid next page', () => {
      spyOn(component, 'loadTickets');

      component.goToPage(2);

      expect(component.pageNumber).toBe(2);
      expect(component.loadTickets).toHaveBeenCalled();
    });

    it('should navigate to a valid later page', () => {
      spyOn(component, 'loadTickets');

      component.goToPage(3);

      expect(component.pageNumber).toBe(3);
      expect(component.loadTickets).toHaveBeenCalled();
    });

    it('should navigate to the last valid page', () => {
      spyOn(component, 'loadTickets');

      component.goToPage(5);

      expect(component.pageNumber).toBe(5);
      expect(component.loadTickets).toHaveBeenCalled();
    });

    it('should not navigate below page one', () => {
      spyOn(component, 'loadTickets');

      component.goToPage(0);

      expect(component.pageNumber).toBe(1);
      expect(component.loadTickets).not.toHaveBeenCalled();
    });

    it('should not navigate to a page above the total pages', () => {
      spyOn(component, 'loadTickets');

      component.goToPage(6);

      expect(component.pageNumber).toBe(1);
      expect(component.loadTickets).not.toHaveBeenCalled();
    });

    it('should not reload the current page', () => {
      component.pageNumber = 3;

      spyOn(component, 'loadTickets');

      component.goToPage(3);

      expect(component.pageNumber).toBe(3);
      expect(component.loadTickets).not.toHaveBeenCalled();
    });
  });

  describe('canGoPrevious', () => {
    it('should return false on the first page', () => {
      component.pageNumber = 1;

      expect(component.canGoPrevious).toBeFalse();
    });

    it('should return true when a previous page exists', () => {
      component.pageNumber = 2;

      expect(component.canGoPrevious).toBeTrue();
    });
  });

  describe('canGoNext', () => {
    it('should return false on the last page', () => {
      component.pageNumber = 5;
      component.totalPages = 5;

      expect(component.canGoNext).toBeFalse();
    });

    it('should return true when a next page exists', () => {
      component.pageNumber = 2;
      component.totalPages = 5;

      expect(component.canGoNext).toBeTrue();
    });
  });

  describe('firstResultNumber', () => {
    it('should return zero when there are no results', () => {
      component.totalCount = 0;

      expect(component.firstResultNumber).toBe(0);
    });

    it('should calculate the first result number correctly', () => {
      component.pageNumber = 3;
      component.pageSize = 20;
      component.totalCount = 45;

      expect(component.firstResultNumber).toBe(41);
    });
  });

  describe('lastResultNumber', () => {
    it('should return zero when there are no results', () => {
      component.totalCount = 0;

      expect(component.lastResultNumber).toBe(0);
    });

    it('should calculate the last result number correctly for a full page', () => {
      component.pageNumber = 2;
      component.pageSize = 20;
      component.totalCount = 45;

      expect(component.lastResultNumber).toBe(40);
    });

    it('should not exceed the total count', () => {
      component.pageNumber = 3;
      component.pageSize = 20;
      component.totalCount = 45;

      expect(component.lastResultNumber).toBe(45);
    });
  });

  describe('visiblePages', () => {
    it('should return an empty array when there are no pages', () => {
      component.totalPages = 0;

      expect(component.visiblePages).toEqual([]);
    });

    it('should return all pages when there are five or fewer pages', () => {
      component.totalPages = 5;

      expect(component.visiblePages).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return the first five pages when on the first page', () => {
      component.totalPages = 10;
      component.pageNumber = 1;

      expect(component.visiblePages).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return a centered range for a middle page', () => {
      component.totalPages = 10;
      component.pageNumber = 5;

      expect(component.visiblePages).toEqual([3, 4, 5, 6, 7]);
    });

    it('should return the final five pages near the end', () => {
      component.totalPages = 10;
      component.pageNumber = 10;

      expect(component.visiblePages).toEqual([6, 7, 8, 9, 10]);
    });

    it('should handle six total pages', () => {
      component.totalPages = 6;
      component.pageNumber = 6;

      expect(component.visiblePages).toEqual([2, 3, 4, 5, 6]);
    });
  });

  describe('createTicket', () => {
    it('should navigate to ticket creation for an authorized user', () => {
      authServiceSpy.getStoredCurrentUser.and.returnValue({
        userId: '1',
        firstName: 'Customer',
        lastName: 'User',
        fullName: 'Customer User',
        email: '[customer@example.com](mailto:customer@example.com)',
        role: 'Customer',
      });

      component.createTicket();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/tickets/create']);
    });

    it('should not navigate when the current user cannot create tickets', () => {
      authServiceSpy.getStoredCurrentUser.and.returnValue({
        userId: '1',
        firstName: 'Agent',
        lastName: 'User',
        fullName: 'Agent User',
        email: 'agent@example.com',
        role: 'Support Agent',
      });

      component.createTicket();

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('getStatusLabel', () => {
    it('should return the correct status label', () => {
      expect(component.getStatusLabel(TicketStatus.Open)).toBe('Open');
      expect(component.getStatusLabel(TicketStatus.InProgress)).toBe(
        'In Progress',
      );
      expect(component.getStatusLabel(TicketStatus.Resolved)).toBe('Resolved');
      expect(component.getStatusLabel(TicketStatus.Closed)).toBe('Closed');
    });
  });

  describe('getPriorityLabel', () => {
    it('should return the correct priority label', () => {
      expect(component.getPriorityLabel(TicketPriority.Low)).toBe('Low');
      expect(component.getPriorityLabel(TicketPriority.Medium)).toBe('Medium');
      expect(component.getPriorityLabel(TicketPriority.High)).toBe('High');
      expect(component.getPriorityLabel(TicketPriority.Critical)).toBe(
        'Critical',
      );
    });
  });

  describe('getStatusClass', () => {
    it('should return the correct class for open', () => {
      expect(component.getStatusClass(TicketStatus.Open)).toBe('status-open');
    });

    it('should return the correct class for in progress', () => {
      expect(component.getStatusClass(TicketStatus.InProgress)).toBe(
        'status-progress',
      );
    });

    it('should return the correct class for resolved', () => {
      expect(component.getStatusClass(TicketStatus.Resolved)).toBe(
        'status-resolved',
      );
    });

    it('should return the correct class for closed', () => {
      expect(component.getStatusClass(TicketStatus.Closed)).toBe(
        'status-closed',
      );
    });

    it('should return an empty class for an unknown status', () => {
      expect(component.getStatusClass(999 as TicketStatus)).toBe('');
    });
  });

  describe('getPriorityClass', () => {
    it('should return the correct class for low priority', () => {
      expect(component.getPriorityClass(TicketPriority.Low)).toBe(
        'priority-low',
      );
    });

    it('should return the correct class for medium priority', () => {
      expect(component.getPriorityClass(TicketPriority.Medium)).toBe(
        'priority-medium',
      );
    });

    it('should return the correct class for high priority', () => {
      expect(component.getPriorityClass(TicketPriority.High)).toBe(
        'priority-high',
      );
    });

    it('should return the correct class for critical priority', () => {
      expect(component.getPriorityClass(TicketPriority.Critical)).toBe(
        'priority-critical',
      );
    });

    it('should return an empty class for an unknown priority', () => {
      expect(component.getPriorityClass(999 as TicketPriority)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('should return a dash for an empty value', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('should return the original value for an invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });

    it('should format a valid ISO date', () => {
      const result = component.formatDate('2026-08-28T10:30:00Z');

      expect(result).toContain('Aug');
      expect(result).toContain('28');
      expect(result).toContain('2026');
    });
  });

  describe('formatWorkTime', () => {
    it('should return zero minutes for an empty value', () => {
      expect(component.formatWorkTime('')).toBe('0m');
    });

    it('should return the original value for an invalid TimeSpan', () => {
      expect(component.formatWorkTime('invalid')).toBe('invalid');
    });

    it('should format hours and minutes', () => {
      expect(component.formatWorkTime('02:30:00')).toBe('2h 30m');
    });

    it('should format minutes only', () => {
      expect(component.formatWorkTime('00:45:00')).toBe('45m');
    });

    it('should format hours only', () => {
      expect(component.formatWorkTime('03:00:00')).toBe('3h');
    });

    it('should format zero duration', () => {
      expect(component.formatWorkTime('00:00:00')).toBe('0m');
    });

    it('should format days, hours and minutes', () => {
      expect(component.formatWorkTime('1.02:30:00')).toBe('1d 2h 30m');
    });

    it('should ignore seconds when formatting', () => {
      expect(component.formatWorkTime('01:15:45')).toBe('1h 15m');
    });
  });
});
