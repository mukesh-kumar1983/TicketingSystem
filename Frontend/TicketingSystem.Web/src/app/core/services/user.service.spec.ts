import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { environment } from '../../../environments/environment';

import {
  CreateUserRequest,
  ManagedUserRole,
  UpdateUserRequest,
  UserResponse,
} from '../../models/user.models';

import { UserService } from './user.service';

/**
 * ============================================================================
 * TicketingSystem - UserService Unit Tests
 * ============================================================================
 *
 * Comprehensive unit tests for UserService.
 *
 * These tests verify:
 *
 * - UserService creation.
 * - Customer retrieval.
 * - SupportAgent retrieval.
 * - Individual user retrieval.
 * - User creation.
 * - User updates.
 * - User deletion.
 * - Customer convenience methods.
 * - SupportAgent convenience methods.
 * - Managed-role validation.
 * - Correct HTTP methods.
 * - Correct API URLs.
 * - Correct request payloads.
 * - Correct response handling.
 *
 * The tests intentionally match the current UserService implementation and
 * current user models.
 *
 * No production service architecture or functionality is changed by these
 * tests.
 * ============================================================================
 */
describe('UserService', () => {
  let service: UserService;
  let httpTestingController: HttpTestingController;

  /**
   * Base URL used by the Angular application.
   */
  const apiUrl = `${environment.apiUrl}/Users`;

  /**
   * Creates a representative Customer response.
   *
   * @returns A valid Customer UserResponse test object.
   */
  const createCustomerResponse = (): UserResponse => ({
    id: 'customer-001',
    firstName: 'John',
    lastName: 'Customer',
    email: 'john.customer@example.com',
    role: 'Customer',
  });

  /**
   * Creates a representative SupportAgent response.
   *
   * @returns A valid SupportAgent UserResponse test object.
   */
  const createAgentResponse = (): UserResponse => ({
    id: 'agent-001',
    firstName: 'Support',
    lastName: 'Agent',
    email: 'support.agent@example.com',
    role: 'SupportAgent',
  });

  /**
   * Creates a representative Customer creation request.
   *
   * @returns A valid CreateUserRequest test object.
   */
  const createCustomerRequest = (): CreateUserRequest => ({
    firstName: 'John',
    lastName: 'Customer',
    email: 'john.customer@example.com',
    password: 'Password123!',
    role: 'Customer',
  });

  /**
   * Creates a representative SupportAgent creation request.
   *
   * @returns A valid CreateUserRequest test object.
   */
  const createAgentRequest = (): CreateUserRequest => ({
    firstName: 'Support',
    lastName: 'Agent',
    email: 'support.agent@example.com',
    password: 'Password123!',
    role: 'SupportAgent',
  });

  /**
   * Creates a representative Customer update request.
   *
   * @returns A valid UpdateUserRequest test object.
   */
  const createCustomerUpdateRequest = (): UpdateUserRequest => ({
    firstName: 'Updated',
    lastName: 'Customer',
    email: 'updated.customer@example.com',
    role: 'Customer',
  });

  /**
   * Creates a representative SupportAgent update request.
   *
   * @returns A valid UpdateUserRequest test object.
   */
  const createAgentUpdateRequest = (): UpdateUserRequest => ({
    firstName: 'Updated',
    lastName: 'Agent',
    email: 'updated.agent@example.com',
    role: 'SupportAgent',
  });

  /**
   * Configures the Angular testing environment before each test.
   */
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(UserService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  /**
   * Ensures that every HTTP request created by a test has been completed.
   */
  afterEach(() => {
    httpTestingController.verify();
  });

  /**
   * Verifies that Angular can create the UserService.
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * Verifies that getCustomers uses GET.
   */
  it('should retrieve customers using GET', () => {
    const response = [createCustomerResponse()];

    service.getCustomers().subscribe((customers) => {
      expect(customers).toEqual(response);
      expect(customers.length).toBe(1);
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/customers`);

    expect(httpRequest.request.method).toBe('GET');

    httpRequest.flush(response);
  });

  /**
   * Verifies that getCustomers returns an empty collection correctly.
   */
  it('should return an empty customer collection', () => {
    service.getCustomers().subscribe((customers) => {
      expect(customers).toEqual([]);
      expect(customers.length).toBe(0);
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/customers`);

    expect(httpRequest.request.method).toBe('GET');

    httpRequest.flush([]);
  });

  /**
   * Verifies that getAgents uses GET.
   */
  it('should retrieve support agents using GET', () => {
    const response = [createAgentResponse()];

    service.getAgents().subscribe((agents) => {
      expect(agents).toEqual(response);
      expect(agents.length).toBe(1);
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/agents`);

    expect(httpRequest.request.method).toBe('GET');

    httpRequest.flush(response);
  });

  /**
   * Verifies that getAgents returns an empty collection correctly.
   */
  it('should return an empty support-agent collection', () => {
    service.getAgents().subscribe((agents) => {
      expect(agents).toEqual([]);
      expect(agents.length).toBe(0);
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/agents`);

    expect(httpRequest.request.method).toBe('GET');

    httpRequest.flush([]);
  });

  /**
   * Verifies that getUser requests the correct user URL.
   */
  it('should retrieve a user by id', () => {
    const response = createCustomerResponse();

    service.getUser('customer-001').subscribe((user) => {
      expect(user).toEqual(response);
    });

    const httpRequest = httpTestingController.expectOne(
      `${apiUrl}/customer-001`,
    );

    expect(httpRequest.request.method).toBe('GET');

    httpRequest.flush(response);
  });

  /**
   * Verifies that getUser uses the supplied user identifier.
   */
  it('should use the supplied user id when retrieving a user', () => {
    service.getUser('agent-999').subscribe();

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/agent-999`);

    expect(httpRequest.request.method).toBe('GET');

    httpRequest.flush(createAgentResponse());
  });

  /**
   * Verifies that getUser supports a Customer response.
   */
  it('should return a customer from getUser', () => {
    const response = createCustomerResponse();

    service.getUser(response.id).subscribe((user) => {
      expect(user.id).toBe('customer-001');
      expect(user.role).toBe('Customer');
      expect(user.email).toBe('john.customer@example.com');
    });

    const httpRequest = httpTestingController.expectOne(
      `${apiUrl}/customer-001`,
    );

    httpRequest.flush(response);
  });

  /**
   * Verifies that getUser supports a SupportAgent response.
   */
  it('should return a support agent from getUser', () => {
    const response = createAgentResponse();

    service.getUser(response.id).subscribe((user) => {
      expect(user.id).toBe('agent-001');
      expect(user.role).toBe('SupportAgent');
      expect(user.email).toBe('support.agent@example.com');
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/agent-001`);

    httpRequest.flush(response);
  });

  /**
   * Verifies that createUser sends POST.
   */
  it('should create a user', () => {
    const request = createCustomerRequest();
    const response = createCustomerResponse();

    service.createUser(request).subscribe((user) => {
      expect(user).toEqual(response);
    });

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual(request);

    httpRequest.flush(response);
  });

  /**
   * Verifies that createUser preserves all request properties.
   */
  it('should preserve the complete create-user request payload', () => {
    const request: CreateUserRequest = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      password: 'SecurePassword123!',
      role: 'Customer',
    };

    service.createUser(request).subscribe();

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.body).toEqual(request);
    expect(httpRequest.request.body.firstName).toBe('Jane');
    expect(httpRequest.request.body.lastName).toBe('Doe');
    expect(httpRequest.request.body.email).toBe('jane.doe@example.com');
    expect(httpRequest.request.body.password).toBe('SecurePassword123!');
    expect(httpRequest.request.body.role).toBe('Customer');

    httpRequest.flush(createCustomerResponse());
  });

  /**
   * Verifies that createUser can create a SupportAgent.
   */
  it('should create a support agent', () => {
    const request = createAgentRequest();
    const response = createAgentResponse();

    service.createUser(request).subscribe((user) => {
      expect(user).toEqual(response);
      expect(user.role).toBe('SupportAgent');
    });

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual(request);

    httpRequest.flush(response);
  });

  /**
   * Verifies that updateUser sends PUT.
   */
  it('should update a user', () => {
    const request = createCustomerUpdateRequest();
    const response: UserResponse = {
      ...createCustomerResponse(),
      firstName: 'Updated',
      lastName: 'Customer',
      email: 'updated.customer@example.com',
    };

    service.updateUser('customer-001', request).subscribe((user) => {
      expect(user).toEqual(response);
    });

    const httpRequest = httpTestingController.expectOne(
      `${apiUrl}/customer-001`,
    );

    expect(httpRequest.request.method).toBe('PUT');
    expect(httpRequest.request.body).toEqual(request);

    httpRequest.flush(response);
  });

  /**
   * Verifies that updateUser uses the supplied user identifier.
   */
  it('should use the supplied user id when updating a user', () => {
    const request = createAgentUpdateRequest();

    service.updateUser('agent-025', request).subscribe();

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/agent-025`);

    expect(httpRequest.request.method).toBe('PUT');
    expect(httpRequest.request.body).toEqual(request);

    httpRequest.flush(createAgentResponse());
  });

  /**
   * Verifies that updateUser preserves the role.
   */
  it('should preserve the supplied role when updating a user', () => {
    const request: UpdateUserRequest = {
      firstName: 'Updated',
      lastName: 'Agent',
      email: 'updated.agent@example.com',
      role: 'SupportAgent',
    };

    service.updateUser('agent-001', request).subscribe();

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/agent-001`);

    expect(httpRequest.request.body.role).toBe('SupportAgent');

    httpRequest.flush(createAgentResponse());
  });

  /**
   * Verifies that deleteUser sends DELETE.
   */
  it('should delete a user', () => {
    let result: void | null | undefined = undefined;

    service.deleteUser('customer-001').subscribe((response) => {
      result = response;
    });

    const httpRequest = httpTestingController.expectOne(
      `${apiUrl}/customer-001`,
    );

    expect(httpRequest.request.method).toBe('DELETE');

    /*
     * Angular HttpClientTestingBackend returns null when flush(null) is used
     * for an Observable<void>. The service itself remains correctly typed as
     * Observable<void>.
     */
    httpRequest.flush(null);

    expect(result).toBeNull();
  });

  /**
   * Verifies that deleteUser uses the supplied user identifier.
   */
  it('should use the supplied user id when deleting a user', () => {
    service.deleteUser('agent-025').subscribe();

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/agent-025`);

    expect(httpRequest.request.method).toBe('DELETE');

    httpRequest.flush(null);
  });

  /**
   * Verifies that createCustomer delegates to createUser with the Customer
   * role.
   */
  it('should create a customer using the Customer role', () => {
    const request: Omit<CreateUserRequest, 'role'> = {
      firstName: 'Customer',
      lastName: 'One',
      email: 'customer.one@example.com',
      password: 'Password123!',
    };

    const response: UserResponse = {
      id: 'customer-010',
      firstName: 'Customer',
      lastName: 'One',
      email: 'customer.one@example.com',
      role: 'Customer',
    };

    service.createCustomer(request).subscribe((user) => {
      expect(user).toEqual(response);
      expect(user.role).toBe('Customer');
    });

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual({
      ...request,
      role: 'Customer',
    });

    httpRequest.flush(response);
  });

  /**
   * Verifies that createCustomer does not require a role in its input.
   */
  it('should automatically add the Customer role when creating a customer', () => {
    const request: Omit<CreateUserRequest, 'role'> = {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test.customer@example.com',
      password: 'Password123!',
    };

    service.createCustomer(request).subscribe();

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.body.role).toBe('Customer');

    httpRequest.flush(createCustomerResponse());
  });

  /**
   * Verifies that createAgent delegates to createUser with the SupportAgent
   * role.
   */
  it('should create a support agent using the SupportAgent role', () => {
    const request: Omit<CreateUserRequest, 'role'> = {
      firstName: 'Agent',
      lastName: 'One',
      email: 'agent.one@example.com',
      password: 'Password123!',
    };

    const response: UserResponse = {
      id: 'agent-010',
      firstName: 'Agent',
      lastName: 'One',
      email: 'agent.one@example.com',
      role: 'SupportAgent',
    };

    service.createAgent(request).subscribe((user) => {
      expect(user).toEqual(response);
      expect(user.role).toBe('SupportAgent');
    });

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual({
      ...request,
      role: 'SupportAgent',
    });

    httpRequest.flush(response);
  });

  /**
   * Verifies that createAgent automatically assigns the SupportAgent role.
   */
  it('should automatically add the SupportAgent role when creating an agent', () => {
    const request: Omit<CreateUserRequest, 'role'> = {
      firstName: 'Test',
      lastName: 'Agent',
      email: 'test.agent@example.com',
      password: 'Password123!',
    };

    service.createAgent(request).subscribe();

    const httpRequest = httpTestingController.expectOne(apiUrl);

    expect(httpRequest.request.body.role).toBe('SupportAgent');

    httpRequest.flush(createAgentResponse());
  });

  /**
   * Verifies that updateCustomer delegates to updateUser with the Customer
   * role.
   */
  it('should update a customer using the Customer role', () => {
    const request: Omit<UpdateUserRequest, 'role'> = {
      firstName: 'Updated',
      lastName: 'Customer',
      email: 'updated.customer@example.com',
    };

    const response: UserResponse = {
      ...createCustomerResponse(),
      firstName: 'Updated',
      lastName: 'Customer',
      email: 'updated.customer@example.com',
    };

    service.updateCustomer('customer-001', request).subscribe((user) => {
      expect(user).toEqual(response);
      expect(user.role).toBe('Customer');
    });

    const httpRequest = httpTestingController.expectOne(
      `${apiUrl}/customer-001`,
    );

    expect(httpRequest.request.method).toBe('PUT');
    expect(httpRequest.request.body).toEqual({
      ...request,
      role: 'Customer',
    });

    httpRequest.flush(response);
  });

  /**
   * Verifies that updateCustomer automatically supplies the Customer role.
   */
  it('should automatically add the Customer role when updating a customer', () => {
    const request: Omit<UpdateUserRequest, 'role'> = {
      firstName: 'Updated',
      lastName: 'Customer',
      email: 'updated@example.com',
    };

    service.updateCustomer('customer-001', request).subscribe();

    const httpRequest = httpTestingController.expectOne(
      `${apiUrl}/customer-001`,
    );

    expect(httpRequest.request.body.role).toBe('Customer');

    httpRequest.flush(createCustomerResponse());
  });

  /**
   * Verifies that updateAgent delegates to updateUser with the SupportAgent
   * role.
   */
  it('should update a support agent using the SupportAgent role', () => {
    const request: Omit<UpdateUserRequest, 'role'> = {
      firstName: 'Updated',
      lastName: 'Agent',
      email: 'updated.agent@example.com',
    };

    const response: UserResponse = {
      ...createAgentResponse(),
      firstName: 'Updated',
      lastName: 'Agent',
      email: 'updated.agent@example.com',
    };

    service.updateAgent('agent-001', request).subscribe((user) => {
      expect(user).toEqual(response);
      expect(user.role).toBe('SupportAgent');
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/agent-001`);

    expect(httpRequest.request.method).toBe('PUT');
    expect(httpRequest.request.body).toEqual({
      ...request,
      role: 'SupportAgent',
    });

    httpRequest.flush(response);
  });

  /**
   * Verifies that updateAgent automatically supplies the SupportAgent role.
   */
  it('should automatically add the SupportAgent role when updating an agent', () => {
    const request: Omit<UpdateUserRequest, 'role'> = {
      firstName: 'Updated',
      lastName: 'Agent',
      email: 'updated@example.com',
    };

    service.updateAgent('agent-001', request).subscribe();

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/agent-001`);

    expect(httpRequest.request.body.role).toBe('SupportAgent');

    httpRequest.flush(createAgentResponse());
  });

  /**
   * Verifies that Customer is recognized as a managed role.
   */
  it('should recognize Customer as a managed role', () => {
    expect(service.isManagedRole('Customer')).toBeTrue();
  });

  /**
   * Verifies that SupportAgent is recognized as a managed role.
   */
  it('should recognize SupportAgent as a managed role', () => {
    expect(service.isManagedRole('SupportAgent')).toBeTrue();
  });

  /**
   * Verifies that Admin is not recognized as a managed role.
   */
  it('should not recognize Admin as a managed role', () => {
    expect(service.isManagedRole('Admin')).toBeFalse();
  });

  /**
   * Verifies that an unknown role is not recognized as a managed role.
   */
  it('should reject an unknown role as a managed role', () => {
    expect(service.isManagedRole('Unknown')).toBeFalse();
  });

  /**
   * Verifies that an empty role is not recognized as a managed role.
   */
  it('should reject an empty role as a managed role', () => {
    expect(service.isManagedRole('')).toBeFalse();
  });

  /**
   * Verifies that role validation is case-sensitive.
   */
  it('should treat managed roles as case-sensitive', () => {
    expect(service.isManagedRole('customer')).toBeFalse();
    expect(service.isManagedRole('supportagent')).toBeFalse();
  });

  /**
   * Verifies that createCustomer returns the API response unchanged.
   */
  it('should return the created customer from createCustomer', () => {
    const response = createCustomerResponse();

    service
      .createCustomer({
        firstName: response.firstName,
        lastName: response.lastName,
        email: response.email,
        password: 'Password123!',
      })
      .subscribe((user) => {
        expect(user).toEqual(response);
        expect(user.id).toBe('customer-001');
      });

    const httpRequest = httpTestingController.expectOne(apiUrl);

    httpRequest.flush(response);
  });

  /**
   * Verifies that createAgent returns the API response unchanged.
   */
  it('should return the created agent from createAgent', () => {
    const response = createAgentResponse();

    service
      .createAgent({
        firstName: response.firstName,
        lastName: response.lastName,
        email: response.email,
        password: 'Password123!',
      })
      .subscribe((user) => {
        expect(user).toEqual(response);
        expect(user.id).toBe('agent-001');
      });

    const httpRequest = httpTestingController.expectOne(apiUrl);

    httpRequest.flush(response);
  });

  /**
   * Verifies that updateCustomer returns the API response unchanged.
   */
  it('should return the updated customer from updateCustomer', () => {
    const response: UserResponse = {
      ...createCustomerResponse(),
      firstName: 'Updated',
      lastName: 'Customer',
      email: 'updated.customer@example.com',
    };

    service
      .updateCustomer('customer-001', {
        firstName: 'Updated',
        lastName: 'Customer',
        email: 'updated.customer@example.com',
      })
      .subscribe((user) => {
        expect(user).toEqual(response);
        expect(user.role).toBe('Customer');
      });

    const httpRequest = httpTestingController.expectOne(
      `${apiUrl}/customer-001`,
    );

    httpRequest.flush(response);
  });

  /**
   * Verifies that updateAgent returns the API response unchanged.
   */
  it('should return the updated agent from updateAgent', () => {
    const response: UserResponse = {
      ...createAgentResponse(),
      firstName: 'Updated',
      lastName: 'Agent',
      email: 'updated.agent@example.com',
    };

    service
      .updateAgent('agent-001', {
        firstName: 'Updated',
        lastName: 'Agent',
        email: 'updated.agent@example.com',
      })
      .subscribe((user) => {
        expect(user).toEqual(response);
        expect(user.role).toBe('SupportAgent');
      });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/agent-001`);

    httpRequest.flush(response);
  });

  /**
   * Verifies that customer and agent API URLs remain distinct.
   */
  it('should use distinct endpoints for customers and agents', () => {
    service.getCustomers().subscribe();
    service.getAgents().subscribe();

    const customerRequest = httpTestingController.expectOne(
      `${apiUrl}/customers`,
    );

    const agentRequest = httpTestingController.expectOne(`${apiUrl}/agents`);

    expect(customerRequest.request.method).toBe('GET');
    expect(agentRequest.request.method).toBe('GET');

    customerRequest.flush([]);
    agentRequest.flush([]);
  });

  /**
   * Verifies that deleteUser does not send a request body.
   */
  it('should delete a user without a request body', () => {
    service.deleteUser('customer-001').subscribe();

    const httpRequest = httpTestingController.expectOne(
      `${apiUrl}/customer-001`,
    );

    expect(httpRequest.request.method).toBe('DELETE');
    expect(httpRequest.request.body).toBeNull();

    httpRequest.flush(null);
  });

  /**
   * Verifies that the service can handle a Customer response with all fields.
   */
  it('should preserve all customer response properties', () => {
    const response = createCustomerResponse();

    service.getUser(response.id).subscribe((user) => {
      expect(user.id).toBe(response.id);
      expect(user.firstName).toBe(response.firstName);
      expect(user.lastName).toBe(response.lastName);
      expect(user.email).toBe(response.email);
      expect(user.role).toBe(response.role);
    });

    const httpRequest = httpTestingController.expectOne(
      `${apiUrl}/${response.id}`,
    );

    httpRequest.flush(response);
  });

  /**
   * Verifies that the service can handle a SupportAgent response with all
   * fields.
   */
  it('should preserve all support-agent response properties', () => {
    const response = createAgentResponse();

    service.getUser(response.id).subscribe((user) => {
      expect(user.id).toBe(response.id);
      expect(user.firstName).toBe(response.firstName);
      expect(user.lastName).toBe(response.lastName);
      expect(user.email).toBe(response.email);
      expect(user.role).toBe(response.role);
    });

    const httpRequest = httpTestingController.expectOne(
      `${apiUrl}/${response.id}`,
    );

    httpRequest.flush(response);
  });
});
