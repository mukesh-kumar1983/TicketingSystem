import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

/**

* ============================================================================
* TicketingSystem - Authentication Guard Unit Tests
* ============================================================================
*
* Unit tests for the application's authentication guard.
*
* These tests verify that the authentication guard:
*
* * Allows authenticated users to continue to the requested route.
* * Redirects unauthenticated users to the login page.
* * Uses AuthService as the source of authentication state.
*
* These are Angular unit tests. They do not communicate with the real
* TicketingSystem API or database.
*
* ============================================================================
  */
describe('authGuard', () => {
  /**

  * Mock authentication service used by the guard.
    */
  let authService: jasmine.SpyObj<AuthService>;

  /**
  
  * Router instance used to create and inspect the redirect UrlTree.
    */
  let router: Router;

  /**
  
  * Creates the Angular testing environment before every test.
    */
  beforeEach(() => {
    /**
  
    * Create a Jasmine spy object for AuthService.
      */
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated',
    ]);

    /**


      
 * Configure Angular dependency injection for the guard tests.
 */
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    });

    /**
     * Retrieve the Angular Router from the testing environment.
     */
    router = TestBed.inject(Router);
  });

  /**
  
  * Verifies that the guard allows an authenticated user to continue.
    */
  it('should allow an authenticated user to access the route', () => {
    authService.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(result).toBeTrue();
    expect(authService.isAuthenticated).toHaveBeenCalledTimes(1);
  });

  /**
  
  * Verifies that the guard redirects an unauthenticated user to /login.
    */
  it('should redirect an unauthenticated user to the login page', () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(result instanceof UrlTree).toBeTrue();

    const urlTree = result as UrlTree;

    expect(router.serializeUrl(urlTree)).toBe('/login');
    expect(authService.isAuthenticated).toHaveBeenCalledTimes(1);
  });

  /**
  
  * Verifies that the guard checks AuthService for the authentication state.
    */
  it('should use AuthService to determine whether the user is authenticated', () => {
    authService.isAuthenticated.and.returnValue(true);

    TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(authService.isAuthenticated).toHaveBeenCalled();
  });

  /**
  
  * Verifies that an unauthenticated user does not receive permission to
  * continue to the protected route.
    */
  it('should not allow an unauthenticated user to continue to the route', () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(result).not.toBeTrue();
    expect(result instanceof UrlTree).toBeTrue();
  });
});
