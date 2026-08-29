/**
 * ============================================================================
 * TicketingSystem - Root Application Component Unit Tests
 * ============================================================================
 *
 * Unit tests for the root AppComponent.
 *
 * The AppComponent is the root shell of the Angular application. It is
 * intentionally kept very small and is responsible for hosting:
 *
 * - The global loading component.
 * - The global toast notification component.
 * - The Angular RouterOutlet.
 *
 * The tests in this file verify the responsibilities of AppComponent without
 * testing the internal implementation of the child components.
 *
 * ============================================================================
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { AppComponent } from './app.component';

/**
 * ============================================================================
 * APP COMPONENT TEST SUITE
 * ============================================================================
 *
 * Contains unit tests for the application's root component.
 */
describe('AppComponent', () => {
  /**
   * Angular component fixture used to create and inspect AppComponent.
   */
  let fixture: ComponentFixture<AppComponent>;

  /**
   * AppComponent instance under test.
   */
  let component: AppComponent;

  /**
   * Configures the Angular testing environment before each test.
   *
   * NO_ERRORS_SCHEMA is used because this test is concerned only with the
   * root component's template structure. The real LoadingComponent and
   * ToastComponent have their own unit tests and do not need to be instantiated
   * here.
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    /**
     * Create the root component fixture.
     */
    fixture = TestBed.createComponent(AppComponent);

    /**
     * Retrieve the component instance.
     */
    component = fixture.componentInstance;

    /**
     * Render the component template.
     */
    fixture.detectChanges();
  });

  /**
   * Verifies that Angular can create AppComponent successfully.
   */
  it('should create the root application component', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Verifies that the global loading component is present in the root
   * application template.
   */
  it('should render the global loading component', () => {
    const loadingElement = fixture.nativeElement.querySelector('app-loading');

    expect(loadingElement).not.toBeNull();
  });

  /**
   * Verifies that the global toast component is present in the root
   * application template.
   */
  it('should render the global toast component', () => {
    const toastElement = fixture.nativeElement.querySelector('app-toast');

    expect(toastElement).not.toBeNull();
  });

  /**
   * Verifies that the Angular RouterOutlet is present in the root
   * application template.
   */
  it('should render the router outlet', () => {
    const routerOutlet = fixture.nativeElement.querySelector('router-outlet');

    expect(routerOutlet).not.toBeNull();
  });
});
