import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  CreateUserRequest,
  ManagedUserRole,
  UpdateUserRequest,
  UserResponse,
} from '../../models/user.models';

/**
 * ============================================================================
 * TicketingSystem - User Service
 * ============================================================================
 *
 * Provides access to the backend user-management API.
 *
 * This service is used by the Angular administration area to manage:
 *
 * - Customers
 * - Support Agents
 *
 * The backend determines whether the currently authenticated user is allowed
 * to perform these operations.
 *
 * The Angular HTTP interceptor is responsible for attaching the JWT access
 * token to authenticated requests.
 * ============================================================================
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  /**
   * Base URL for the user-management API.
   *
   * The API base URL is centralized inside environment.apiUrl.
   *
   * For example:
   *
   * https://localhost:7223/api
   *
   * This service therefore does not contain the backend host name directly.
   */
  private readonly apiUrl = `${environment.apiUrl}/Users`;

  /**
   * Creates an instance of UserService.
   *
   * @param http Angular HTTP client used to communicate with the backend API.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieves all Customer accounts.
   *
   * @returns An observable containing the customer collection.
   */
  getCustomers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}/customers`);
  }

  /**
   * Retrieves all SupportAgent accounts.
   *
   * @returns An observable containing the support-agent collection.
   */
  getAgents(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}/agents`);
  }

  /**
   * Retrieves a single user by identifier.
   *
   * @param id ASP.NET Core Identity user identifier.
   * @returns An observable containing the requested user.
   */
  getUser(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new Customer or SupportAgent.
   *
   * @param request Information required to create the user.
   * @returns An observable containing the newly created user.
   */
  createUser(request: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, request);
  }

  /**
   * Updates an existing Customer or SupportAgent.
   *
   * @param id ASP.NET Core Identity user identifier.
   * @param request Updated user information.
   * @returns An observable containing the updated user.
   */
  updateUser(id: string, request: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Deletes an existing Customer or SupportAgent.
   *
   * @param id ASP.NET Core Identity user identifier.
   * @returns An observable that completes when deletion succeeds.
   */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new Customer.
   *
   * This convenience method prevents components from having to manually
   * specify the Customer role.
   *
   * @param request User information excluding the role.
   * @returns An observable containing the newly created customer.
   */
  createCustomer(
    request: Omit<CreateUserRequest, 'role'>,
  ): Observable<UserResponse> {
    return this.createUser({
      ...request,
      role: 'Customer',
    });
  }

  /**
   * Creates a new SupportAgent.
   *
   * This convenience method prevents components from having to manually
   * specify the SupportAgent role.
   *
   * @param request User information excluding the role.
   * @returns An observable containing the newly created support agent.
   */
  createAgent(
    request: Omit<CreateUserRequest, 'role'>,
  ): Observable<UserResponse> {
    return this.createUser({
      ...request,
      role: 'SupportAgent',
    });
  }

  /**
   * Updates an existing Customer.
   *
   * The role remains Customer.
   *
   * @param id ASP.NET Core Identity user identifier.
   * @param request Updated customer information.
   * @returns An observable containing the updated customer.
   */
  updateCustomer(
    id: string,
    request: Omit<UpdateUserRequest, 'role'>,
  ): Observable<UserResponse> {
    return this.updateUser(id, {
      ...request,
      role: 'Customer',
    });
  }

  /**
   * Updates an existing SupportAgent.
   *
   * The role remains SupportAgent.
   *
   * @param id ASP.NET Core Identity user identifier.
   * @param request Updated agent information.
   * @returns An observable containing the updated support agent.
   */
  updateAgent(
    id: string,
    request: Omit<UpdateUserRequest, 'role'>,
  ): Observable<UserResponse> {
    return this.updateUser(id, {
      ...request,
      role: 'SupportAgent',
    });
  }

  /**
   * Determines whether a user role is managed by the administration screens.
   *
   * @param role Role to evaluate.
   * @returns True when the role can be managed through this service.
   */
  isManagedRole(role: string): role is ManagedUserRole {
    return role === 'Customer' || role === 'SupportAgent';
  }
}
