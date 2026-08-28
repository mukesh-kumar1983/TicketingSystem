import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { createRoleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './pages/login/login.component';

/**
 * ============================================================================
 * TicketingSystem - Application Routes
 * ============================================================================
 *
 * Defines all routes available in the TicketingSystem Angular application.
 *
 * PUBLIC:
 *
 * - /login
 *
 * AUTHENTICATED:
 *
 * - /dashboard
 * - /tickets
 * - /tickets/create
 * - /tickets/:id
 * - /customers
 * - /agents
 * - /settings
 *
 * ROLE AUTHORIZATION:
 *
 * Customer:
 *
 * - Dashboard
 * - Tickets
 * - Create Ticket
 * - Ticket Details
 * - Settings
 *
 * Support Agent:
 *
 * - Dashboard
 * - Tickets
 * - Ticket Details
 * - Settings
 *
 * Administrator:
 *
 * - Dashboard
 * - Tickets
 * - Create Ticket
 * - Ticket Details
 * - Customers
 * - Support Agents
 * - Settings
 *
 * Feature components are lazy-loaded.
 *
 * IMPORTANT:
 *
 * Route authorization complements the sidebar visibility rules.
 *
 * The sidebar determines what users should normally see.
 * The role guard prevents unauthorized direct URL navigation as well.
 * ============================================================================
 */

/**
 * Application role names used by the backend and frontend.
 *
 * Keeping these values in one place avoids repeated string literals throughout
 * the route configuration.
 */
const ROLES = {
  ADMIN: 'Admin',
  SUPPORT_AGENT: 'SupportAgent',
  CUSTOMER: 'Customer',
} as const;

/**
 * Application route configuration.
 */
export const routes: Routes = [
  // ===========================================================================
  // PUBLIC ROUTES
  // ===========================================================================

  /**
   * Login page.
   */
  {
    path: 'login',
    component: LoginComponent,
  },

  // ===========================================================================
  // AUTHENTICATED APPLICATION
  // ===========================================================================

  /**
   * Main authenticated application shell.
   */
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],

    children: [
      // -----------------------------------------------------------------------
      // DASHBOARD
      // -----------------------------------------------------------------------

      /**
       * Dashboard page.
       *
       * All authenticated application roles can access the dashboard.
       */
      {
        path: 'dashboard',
        canActivate: [
          createRoleGuard([ROLES.ADMIN, ROLES.SUPPORT_AGENT, ROLES.CUSTOMER]),
        ],
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (module) => module.DashboardComponent,
          ),
      },

      // -----------------------------------------------------------------------
      // TICKETS
      // -----------------------------------------------------------------------

      /**
       * Ticket list page.
       *
       * All authenticated application roles can view tickets according to
       * backend authorization rules.
       */
      {
        path: 'tickets',
        canActivate: [
          createRoleGuard([ROLES.ADMIN, ROLES.SUPPORT_AGENT, ROLES.CUSTOMER]),
        ],
        loadComponent: () =>
          import('./pages/tickets/tickets.component').then(
            (module) => module.TicketsComponent,
          ),
      },

      // -----------------------------------------------------------------------
      // CREATE TICKET
      // -----------------------------------------------------------------------

      /**
       * Ticket creation page.
       *
       * Customers and administrators can create tickets.
       *
       * Support agents intentionally cannot access this page because agents
       * work on tickets assigned to them rather than creating customer
       * requests.
       */
      {
        path: 'tickets/create',
        canActivate: [createRoleGuard([ROLES.ADMIN, ROLES.CUSTOMER])],
        loadComponent: () =>
          import('./pages/tickets/create-ticket/create-ticket.component').then(
            (module) => module.CreateTicketComponent,
          ),
      },

      // -----------------------------------------------------------------------
      // TICKET DETAILS
      // -----------------------------------------------------------------------

      /**
       * Ticket detail page.
       *
       * All authenticated roles may open ticket details subject to the
       * backend's ticket-level authorization rules.
       */
      {
        path: 'tickets/:id',
        canActivate: [
          createRoleGuard([ROLES.ADMIN, ROLES.SUPPORT_AGENT, ROLES.CUSTOMER]),
        ],
        loadComponent: () =>
          import('./pages/tickets/ticket-detail/ticket-detail.component').then(
            (module) => module.TicketDetailComponent,
          ),
      },

      // -----------------------------------------------------------------------
      // CUSTOMERS
      // -----------------------------------------------------------------------

      /**
       * Customer management page.
       *
       * Customer management is an administrator-only function.
       */
      {
        path: 'customers',
        canActivate: [createRoleGuard([ROLES.ADMIN])],
        loadComponent: () =>
          import('./pages/customers/customers.component').then(
            (module) => module.CustomersComponent,
          ),
      },

      // -----------------------------------------------------------------------
      // SUPPORT AGENTS
      // -----------------------------------------------------------------------

      /**
       * Support-agent management page.
       *
       * Only administrators can manage support agents.
       *
       * Support agents therefore do not see this page in the sidebar and
       * cannot access it directly through /agents.
       */
      {
        path: 'agents',
        canActivate: [createRoleGuard([ROLES.ADMIN])],
        loadComponent: () =>
          import('./pages/agents/agents.component').then(
            (module) => module.AgentsComponent,
          ),
      },

      // -----------------------------------------------------------------------
      // SETTINGS
      // -----------------------------------------------------------------------

      /**
       * Settings page.
       *
       * Every authenticated role can manage their own profile settings.
       */
      {
        path: 'settings',
        canActivate: [
          createRoleGuard([ROLES.ADMIN, ROLES.SUPPORT_AGENT, ROLES.CUSTOMER]),
        ],
        loadComponent: () =>
          import('./pages/settings/settings.component').then(
            (module) => module.SettingsComponent,
          ),
      },

      // -----------------------------------------------------------------------
      // DEFAULT
      // -----------------------------------------------------------------------

      /**
       * Redirect authenticated root to dashboard.
       */
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // ===========================================================================
  // FALLBACK
  // ===========================================================================

  /**
   * Redirect unknown URLs to login.
   */
  {
    path: '**',
    redirectTo: 'login',
  },
];
