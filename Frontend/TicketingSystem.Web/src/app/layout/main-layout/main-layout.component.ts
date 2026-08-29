import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { CurrentUser } from '../../models/authentication.models';
import { FooterComponent } from '../../shared/components/footer/footer.component';

/**

* ============================================================================
* TicketingSystem - Main Layout Component
* ============================================================================
*
* Provides the main authenticated application shell.
*
* Responsibilities:
*
* * Application branding.
* * Sidebar navigation.
* * Role-based navigation visibility.
* * Top application header.
* * Current authenticated-user information.
* * Mobile sidebar behaviour.
* * Logout functionality.
* * Router outlet for authenticated feature pages.
* * Reusable application footer.
*
* ============================================================================
* ROLE-BASED NAVIGATION
* ============================================================================
*
* Customer:
*
* * Dashboard
* * Tickets
* * Settings
*
* Support Agent:
*
* * Dashboard
* * Tickets
* * Settings
*
* Administrator:
*
* * Dashboard
* * Tickets
* * Customers
* * Support Agents
* * Settings
*
* ============================================================================
*
* IMPORTANT:
*
* Navigation visibility is a frontend usability concern only.
*
* Backend authorization remains responsible for protecting the actual
* API endpoints and application resources.
*
* ============================================================================
* CURRENT USER SYNCHRONIZATION
* ============================================================================
*
* The authenticated user is provided by AuthService.currentUser$.
*
* The component subscribes to this observable so that profile changes made
* elsewhere in the application are immediately reflected in the main layout.
*
* ============================================================================
  */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FooterComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  /**

  * Controls whether the mobile navigation sidebar is visible.
    */
  isSidebarOpen = false;

  /**
  
  * Contains the currently authenticated user's information.
  *
  * This property remains compatible with the existing HTML template.
  *
  * AuthService updates this property whenever the current-user state
  * changes.
    */
  currentUser: CurrentUser | null = null;

  /**
  
  * Subscription used to observe current-user changes.
    */
  private currentUserSubscription?: Subscription;

  /**
  
  * Creates an instance of MainLayoutComponent.
  *
  * @param authService Application authentication service.
  * @param router Angular router used for application navigation.
    */
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  /**
  
  * Initializes the Main Layout component.
  *
  * The component subscribes to AuthService.currentUser$ so that the layout
  * always displays the latest authenticated-user information.
    */
  ngOnInit(): void {
    /**
  
    * Subscribe to the application's central current-user state.
    *
    * BehaviorSubject immediately emits the current value when this
    * subscription is created, so the layout is populated without requiring
    * an additional API request.
    *
    * It will also emit whenever Settings or another part of the application
    * updates the authenticated user's profile.
      */
    this.currentUserSubscription = this.authService.currentUser$.subscribe(
      (user) => {
        /**
    
        * Replace the local reference with the latest authenticated user.
        *
        * Angular automatically updates any template expressions that depend
        * on currentUser, userDisplayName, userInitial, or userRole.
          */
        this.currentUser = user;
      },
    );
  }

  /**
  
  * Releases resources when the component is destroyed.
  *
  * Unsubscribing prevents the component from remaining attached to the
  * AuthService current-user stream after it has been removed from the
  * application.
    */
  ngOnDestroy(): void {
    this.currentUserSubscription?.unsubscribe();
  }

  /**
  
  * Determines whether the authenticated user is an administrator.
  *
  * @returns True when the current user's role is Admin.
    */
  get isAdmin(): boolean {
    return this.isRole('Admin');
  }

  /**
  
  * Determines whether the authenticated user is a support agent.
  *
  * @returns True when the current user's role is SupportAgent.
    */
  get isSupportAgent(): boolean {
    return this.isRole('SupportAgent');
  }

  /**
  
  * Determines whether the authenticated user is a customer.
  *
  * @returns True when the current user's role is Customer.
    */
  get isCustomer(): boolean {
    return this.isRole('Customer');
  }

  /**
  
  * Determines whether the authenticated user has the specified role.
  *
  * @param role Expected application role.
  * @returns True when the current user's role matches the supplied role.
    */
  private isRole(role: string): boolean {
    return (
      this.currentUser?.role?.trim().toLowerCase() === role.trim().toLowerCase()
    );
  }

  /**
  
  * Toggles the mobile navigation sidebar.
    */
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /**
  
  * Closes the mobile navigation sidebar.
    */
  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  /**
  
  * Logs the current user out of the application.
    */
  logout(): void {
    /**
  
    * Clear authentication information.
    *
    * AuthService also publishes null to currentUser$.
      */
    this.authService.logout();

    /**


      
 * Redirect the user to the login page.
 */
    this.router.navigate(['/login']);
  }

  /**
  
  * Returns the user's display name.
  *
  * The preferred value is CurrentUser.fullName. If it is unavailable,
  * first and last names are combined as a fallback.
  *
  * @returns The user's display name.
    */
  get userDisplayName(): string {
    if (!this.currentUser) {
      return 'User';
    }

    /**


      
 * Prefer the backend-provided full name when available.
 */
    const fullName = this.currentUser.fullName?.trim();

    if (fullName) {
      return fullName;
    }

    /**
     * Fall back to first name + last name.
     */
    const name =
      `${this.currentUser.firstName ?? ''} ${this.currentUser.lastName ?? ''} `.trim();

    return name || 'User';
  }

  /**
  
  * Returns the first character of the user's display name.
  *
  * @returns A single uppercase character.
    */
  get userInitial(): string {
    return this.userDisplayName.charAt(0).toUpperCase();
  }

  /**
  
  * Returns the authenticated user's role.
  *
  * @returns The user's role or a fallback value.
    */
  get userRole(): string {
    return this.currentUser?.role || 'Authenticated';
  }
}
