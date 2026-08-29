import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  CurrentUser,
  LoginRequest,
  LoginResponse,
  UpdateCurrentUserRequest,
} from '../../models/authentication.models';

/**

* ============================================================================
* TicketingSystem - Authentication Service
* ============================================================================
*
* Provides authentication-related functionality for the Angular application.
*
* Responsibilities:
*
* * Authenticate users against the TicketingSystem API.
* * Store the JWT access token after successful authentication.
* * Maintain the currently authenticated user's state.
* * Retrieve the currently authenticated user from the backend.
* * Update the currently authenticated user's profile.
* * Keep localStorage synchronized with the current-user state.
* * Notify interested components when the authenticated user's information
* changes.
* * Determine whether an access token is available.
* * Determine the current user's role.
* * Clear authentication information during logout.
*
* ============================================================================
* CURRENT USER STATE
* ============================================================================
*
* The authenticated user's information is maintained using a
* BehaviorSubject.
*
* This allows components such as MainLayoutComponent, SettingsComponent and
* TicketDetailComponent to react immediately when the authenticated user's
* information changes.
* ============================================================================
  */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**

  * Base URL of the TicketingSystem API.
  *
  * The environment configuration contains the `/api` segment.
    */
  private readonly apiUrl = environment.apiUrl;

  /**
  
  * Name of the localStorage entry containing the JWT access token.
    */
  private readonly accessTokenKey = 'ticketing_access_token';

  /**
  
  * Name of the localStorage entry containing the authenticated user's
  * information.
    */
  private readonly currentUserKey = 'ticketing_current_user';

  /**
  
  * Reactive state containing the currently authenticated user.
  *
  * The initial value is restored from localStorage so that the user's
  * information survives a browser refresh.
    */
  private readonly currentUserSubject = new BehaviorSubject<CurrentUser | null>(
    this.getStoredCurrentUser(),
  );

  /**
  
  * Public read-only observable representing the current authenticated user.
    */
  readonly currentUser$ = this.currentUserSubject.asObservable();

  /**
  
  * Creates an instance of AuthService.
  *
  * @param http Angular HttpClient used to communicate with the API.
    */
  constructor(private readonly http: HttpClient) {}

  /**
  
  * Authenticates a user using the supplied credentials.
  *
  * API endpoint:
  *
  * POST /api/Auth/login
  *
  * @param request Login credentials submitted by the user.
  * @returns Observable containing the authentication response.
    */
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/Auth/login`, request)
      .pipe(
        tap((response) => {
          this.storeAuthentication(response);
        }),
      );
  }

  /**
  
  * Retrieves information about the currently authenticated user.
  *
  * API endpoint:
  *
  * GET /api/Auth/me
  *
  * @returns Observable containing the current user's information.
    */
  getCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.apiUrl}/Auth/me`).pipe(
      tap((user) => {
        this.storeCurrentUser(user);
      }),
    );
  }

  /**
  
  * Updates the currently authenticated user's profile.
  *
  * API endpoint:
  *
  * PUT /api/Auth/me
  *
  * @param request New profile information.
  * @returns Observable containing the updated user.
    */
  updateCurrentUser(
    request: UpdateCurrentUserRequest,
  ): Observable<CurrentUser> {
    return this.http.put<CurrentUser>(`${this.apiUrl}/Auth/me`, request).pipe(
      tap((user) => {
        this.storeCurrentUser(user);
      }),
    );
  }

  /**
  
  * Determines whether an access token currently exists.
  *
  * @returns True when an access token exists; otherwise false.
    */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
  
  * Returns the currently stored JWT access token.
  *
  * @returns The JWT access token, or null when no token exists.
    */
  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  /**
  
  * Returns the currently known authenticated user synchronously.
  *
  * @returns The current authenticated user, or null when unavailable.
    */
  getCurrentUserValue(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  /**
  
  * Returns the role of the currently authenticated user.
  *
  * The value is normalized so callers do not need to worry about casing
  * differences between backend and frontend role representations.
  *
  * @returns Current user's role, or null when no authenticated user exists.
    */
  getCurrentUserRole(): string | null {
    const role = this.currentUserSubject.value?.role;

    return role ? role.trim().toLowerCase() : null;
  }

  /**
  
  * Determines whether the current authenticated user is a Customer.
  *
  * @returns True when the current user has the Customer role.
    */
  isCustomer(): boolean {
    return this.getCurrentUserRole() === 'customer';
  }

  /**
  
  * Determines whether the current authenticated user is an Administrator.
  *
  * @returns True when the current user has the Admin role.
    */
  isAdmin(): boolean {
    return this.getCurrentUserRole() === 'admin';
  }

  /**
  
  * Determines whether the current authenticated user is a Support Agent.
  *
  * @returns True when the current user has the Agent role.
    */
  isAgent(): boolean {
    return this.getCurrentUserRole() === 'agent';
  }

  /**
  
  * Returns the locally stored current user.
  *
  * @returns The stored current user, or null when no user is stored.
    */
  getStoredCurrentUser(): CurrentUser | null {
    const storedUser = localStorage.getItem(this.currentUserKey);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as CurrentUser;
    } catch {
      /**
       * Remove corrupted user information so that the application does not
       * repeatedly attempt to parse invalid JSON.
       */
      localStorage.removeItem(this.currentUserKey);

      return null;
    }
  }

  /**
  
  * Logs the current user out of the application.
  *
  * Authentication information is removed from localStorage and the
  * reactive current-user state is reset to null.
    */
  logout(): void {
    /**
  
    * Remove the JWT access token.
      */
    localStorage.removeItem(this.accessTokenKey);

    /**


      
 * Remove the cached current-user information.
 */
    localStorage.removeItem(this.currentUserKey);

    /**
     * Notify all subscribers that there is no longer an authenticated user.
     */
    this.currentUserSubject.next(null);
  }

  /**
  
  * Stores authentication information returned by the API.
  *
  * @param response Successful login response returned by the backend.
    */
  private storeAuthentication(response: LoginResponse): void {
    /**
  
    * Store the JWT access token.
      */
    localStorage.setItem(this.accessTokenKey, response.accessToken);

    /**


      
 * Convert the login response into the application's CurrentUser model.
 */
    const currentUser: CurrentUser = {
      userId: response.userId,
      firstName: response.firstName,
      lastName: response.lastName,
      fullName: response.fullName,
      email: response.email,
      role: response.role,
    };

    /**
     * Store the user in both localStorage and the reactive state.
     */
    this.storeCurrentUser(currentUser);
  }

  /**
  
  * Stores the current user's information.
  *
  * @param user Current authenticated user.
    */
  private storeCurrentUser(user: CurrentUser): void {
    /**
  
    * Persist the user so the information survives a page refresh.
      */
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));

    /**


      
 * Publish the new user to all active subscribers.
 */
    this.currentUserSubject.next(user);
  }
}
