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
 * - Authenticate users against the TicketingSystem API.
 * - Store the JWT access token after successful authentication.
 * - Maintain the currently authenticated user's state.
 * - Retrieve the currently authenticated user from the backend.
 * - Update the currently authenticated user's profile.
 * - Keep localStorage synchronized with the current-user state.
 * - Notify interested components when the authenticated user's information
 *   changes.
 * - Determine whether an access token is available.
 * - Clear authentication information during logout.
 *
 * ============================================================================
 * CURRENT USER STATE
 * ============================================================================
 *
 * The authenticated user's information is maintained using a
 * BehaviorSubject.
 *
 * This is important because multiple components may need the current user's
 * information at the same time.
 *
 * For example:
 *
 *     MainLayoutComponent
 *             │
 *             │ subscribes
 *             ▼
 *        AuthService
 *             ▲
 *             │
 *             │ updates
 *             │
 *       SettingsComponent
 *
 * When Settings updates the user's name, AuthService publishes the updated
 * CurrentUser object and MainLayoutComponent immediately receives it.
 *
 * Therefore the application does NOT need to logout/login again simply to
 * refresh the displayed user information.
 *
 * ============================================================================
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * Base URL of the TicketingSystem API.
   *
   * The environment configuration already contains the `/api` segment:
   *
   *     https://localhost:7223/api
   *
   * Individual authentication endpoints are therefore appended directly
   * without adding an extra space or slash.
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
   * BehaviorSubject is used instead of Subject because new subscribers
   * should immediately receive the latest known user.
   *
   * The initial value is loaded from localStorage so that the application
   * can restore the user's information after a browser refresh.
   */
  private readonly currentUserSubject = new BehaviorSubject<CurrentUser | null>(
    this.getStoredCurrentUser(),
  );

  /**
   * Public read-only observable representing the current authenticated user.
   *
   * Components should subscribe to this observable when they need to react
   * to changes in the authenticated user's information.
   *
   * Components should not modify the subject directly.
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
   * After successful authentication, both the JWT token and current-user
   * state are stored.
   *
   * API endpoint:
   *
   *     POST /api/Auth/login
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
   * The backend response is also synchronized with the local current-user
   * state.
   *
   * This ensures that if the backend contains newer profile information,
   * every component subscribed to currentUser$ receives the latest value.
   *
   * API endpoint:
   *
   *     GET /api/Auth/me
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
   * The JWT is automatically attached by the authentication interceptor.
   *
   * After the backend successfully updates the profile, the returned user
   * is immediately published through currentUser$.
   *
   * This is what allows the Main Layout to update the displayed name without
   * requiring a logout/login cycle.
   *
   * API endpoint:
   *
   *     PUT /api/Auth/me
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
   * This is useful for components that need the current value immediately
   * rather than subscribing to currentUser$.
   *
   * @returns The current authenticated user, or null when unavailable.
   */
  getCurrentUserValue(): CurrentUser | null {
    return this.currentUserSubject.value;
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
   *
   * Resetting the BehaviorSubject is important because components such as
   * MainLayoutComponent may still be subscribed when logout occurs.
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
   * Two pieces of state are intentionally synchronized:
   *
   * 1. localStorage
   *    - survives browser refreshes.
   *
   * 2. BehaviorSubject
   *    - immediately notifies active Angular components.
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
     *
     * MainLayoutComponent will therefore immediately receive the updated
     * first name, last name, full name, email, etc.
     */
    this.currentUserSubject.next(user);
  }
}
