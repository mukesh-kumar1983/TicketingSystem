import { Component } from '@angular/core';

/**

* ============================================================================
* TicketingSystem - Application Footer Component
* ============================================================================
*
* Provides the reusable application footer displayed across the application.
*
* The component is intentionally implemented as a standalone Angular
* component so it can be reused by both public and authenticated pages
* without introducing additional module dependencies.
*
* Current usage:
*
* * Login page.
* * Main authenticated application layout.
*
* The copyright year is generated dynamically from the browser's current
* calendar year. This prevents the application from requiring a source-code
* change when the calendar year changes.
*
* Example output:
*
* © 2026 Mukesh Kumar · All rights reserved · Ticketing System
*
* ============================================================================
  */
@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  /**

  * Current calendar year displayed in the application footer.
  *
  * The value is calculated when the component is instantiated.
  *
  * Examples:
  *
  * * 2026 during 2026.
  * * 2027 during 2027.
  * * 2028 during 2028.
      */
  readonly currentYear = new Date().getFullYear();
}
