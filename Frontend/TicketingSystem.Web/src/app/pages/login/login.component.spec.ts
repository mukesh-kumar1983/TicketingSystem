import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import {
  LoginRequest,
  LoginResponse,
} from '../../models/authentication.models';

/**

* Unit tests for LoginComponent.
*
* These tests verify:
*
* * Component creation.
* * Login form initialization.
* * Required-field validation.
* * Email validation.
* * Password validation.
* * Invalid-form submission behavior.
* * Login request payload preservation.
* * AuthService invocation.
* * Loading state behavior.
* * Successful login navigation.
* * HTTP 401 authentication errors.
* * General/network errors.
* * Clearing previous errors before a new login attempt.
    */
describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  /**
  
  * Represents a valid authentication response returned by
  * AuthService.login().
  *
  * The response is intentionally typed as LoginResponse because
  * LoginComponent only requires the successful completion of the
  * login observable.
    */
  const loginResponse = {} as LoginResponse;

  /**
  
  * Creates the testing environment before every test.
    */
  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
    ]);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
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

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  /**
  
  * Verifies that the LoginComponent can be created.
    */
  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  /**
  
  * Verifies that the login form contains the expected controls.
    */
  it('should initialize the login form with email and password controls', () => {
    expect(component.loginForm.contains('email')).toBeTrue();
    expect(component.loginForm.contains('password')).toBeTrue();
  });

  /**
  
  * Verifies that the email control starts empty.
    */
  it('should initialize the email control with an empty value', () => {
    expect(component.loginForm.controls.email.value).toBe('');
  });

  /**
  
  * Verifies that the password control starts empty.
    */
  it('should initialize the password control with an empty value', () => {
    expect(component.loginForm.controls.password.value).toBe('');
  });

  /**
  
  * Verifies that email is required.
    */
  it('should require an email address', () => {
    const emailControl = component.loginForm.controls.email;

    emailControl.setValue('');

    expect(emailControl.hasError('required')).toBeTrue();
    expect(emailControl.invalid).toBeTrue();
  });

  /**
  
  * Verifies that a valid email address is accepted.
    */
  it('should accept a valid email address', () => {
    const emailControl = component.loginForm.controls.email;

    emailControl.setValue('user@example.com');

    expect(emailControl.valid).toBeTrue();
    expect(emailControl.hasError('required')).toBeFalse();
    expect(emailControl.hasError('email')).toBeFalse();
  });

  /**
  
  * Verifies that an invalid email address is rejected.
    */
  it('should reject an invalid email address', () => {
    const emailControl = component.loginForm.controls.email;

    emailControl.setValue('invalid-email');

    expect(emailControl.hasError('email')).toBeTrue();
    expect(emailControl.invalid).toBeTrue();
  });

  /**
  
  * Verifies that the password control is required.
    */
  it('should require a password', () => {
    const passwordControl = component.loginForm.controls.password;

    passwordControl.setValue('');

    expect(passwordControl.hasError('required')).toBeTrue();
    expect(passwordControl.invalid).toBeTrue();
  });

  /**
  
  * Verifies that a non-empty password is accepted.
    */
  it('should accept a non-empty password', () => {
    const passwordControl = component.loginForm.controls.password;

    passwordControl.setValue('Password123!');

    expect(passwordControl.valid).toBeTrue();
    expect(passwordControl.hasError('required')).toBeFalse();
  });

  /**
  
  * Verifies that the form starts in an invalid state.
    */
  it('should initialize with an invalid form', () => {
    expect(component.loginForm.invalid).toBeTrue();
  });

  /**
  
  * Verifies that submitting an invalid form does not call AuthService.
    */
  it('should not call AuthService when the login form is invalid', () => {
    component.loginForm.setValue({
      email: '',
      password: '',
    });

    component.onSubmit();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  /**
  
  * Verifies that invalid submission marks all controls as touched.
    */
  it('should mark all controls as touched when submitting an invalid form', () => {
    component.loginForm.setValue({
      email: '',
      password: '',
    });

    expect(component.loginForm.controls.email.touched).toBeFalse();

    expect(component.loginForm.controls.password.touched).toBeFalse();

    component.onSubmit();

    expect(component.loginForm.controls.email.touched).toBeTrue();
    expect(component.loginForm.controls.password.touched).toBeTrue();
  });

  /**
  
  * Verifies that invalid submission does not start loading.
    */
  it('should not start loading when the form is invalid', () => {
    component.loginForm.setValue({
      email: '',
      password: '',
    });

    component.onSubmit();

    expect(component.isLoading).toBeFalse();
  });

  /**
  
  * Verifies that invalid submission does not navigate.
    */
  it('should not navigate when the login form is invalid', () => {
    component.loginForm.setValue({
      email: 'invalid-email',
      password: '',
    });

    component.onSubmit();

    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  /**
  
  * Verifies that valid credentials are passed to AuthService.
  *
  * The controls are populated individually to match the actual
  * LoginComponent form structure.
    */
  it('should send the entered credentials to AuthService', () => {
    authServiceSpy.login.and.returnValue(of(loginResponse));

    component.loginForm.controls.email.setValue('user@example.com');

    component.loginForm.controls.password.setValue('Password123!');

    component.loginForm.updateValueAndValidity();

    expect(component.loginForm.valid).toBeTrue();

    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledTimes(1);
    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Password123!',
    });
  });

  /**
  
  * Verifies that the exact password is preserved.
    */
  it('should preserve the exact password in the login request', () => {
    authServiceSpy.login.and.returnValue(of(loginResponse));

    component.loginForm.controls.email.setValue('user@example.com');

    component.loginForm.controls.password.setValue('P@ssw0rd!123');

    component.onSubmit();

    const request = authServiceSpy.login.calls.mostRecent().args[0];

    expect(request.password).toBe('P@ssw0rd!123');
  });

  /**
  
  * Verifies that the exact email is preserved.
    */
  it('should preserve the exact email in the login request', () => {
    authServiceSpy.login.and.returnValue(of(loginResponse));

    component.loginForm.controls.email.setValue('test.user@example.com');

    component.loginForm.controls.password.setValue('Password123!');

    component.onSubmit();

    const request = authServiceSpy.login.calls.mostRecent().args[0];

    expect(request.email).toBe('test.user@example.com');
  });

  /**
  
  * Verifies that a valid submission sets the loading state while
  * the authentication observable is still in progress.
    */
  it('should set isLoading to true while login is in progress', () => {
    const loginSubject = new Subject<LoginResponse>();

    authServiceSpy.login.and.returnValue(loginSubject.asObservable());

    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'Password123!',
    });

    component.onSubmit();

    expect(component.isLoading).toBeTrue();

    loginSubject.next(loginResponse);
    loginSubject.complete();
  });

  /**
  
  * Verifies that successful authentication navigates to the dashboard.
    */
  it('should navigate to the dashboard after successful login', () => {
    authServiceSpy.login.and.returnValue(of(loginResponse));
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'Password123!',
    });

    component.onSubmit();

    expect(routerSpy.navigate).toHaveBeenCalledTimes(1);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  /**
  
  * Verifies that successful login leaves the error message empty.
    */
  it('should keep the error message empty after successful login', () => {
    component.errorMessage = 'Previous authentication error.';

    authServiceSpy.login.and.returnValue(of(loginResponse));

    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'Password123!',
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('');
  });

  /**
  
  * Verifies that a previous error is cleared before a new valid
  * authentication request begins.
    */
  it('should clear a previous error before starting a new login attempt', () => {
    component.errorMessage = 'Previous error.';

    authServiceSpy.login.and.returnValue(
      throwError(() => ({
        status: 500,
      })),
    );

    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'Password123!',
    });

    component.onSubmit();

    expect(component.errorMessage).not.toBe('Previous error.');
  });

  /**
  
  * Verifies that HTTP 401 returns the friendly invalid-credentials
  * message.
    */
  it('should display the invalid credentials message for a 401 error', () => {
    authServiceSpy.login.and.returnValue(
      throwError(() => ({
        status: 401,
      })),
    );

    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'WrongPassword',
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('Invalid email address or password.');
  });

  /**
  
  * Verifies that a 401 error stops the loading indicator.
    */
  it('should stop loading after a 401 authentication error', () => {
    authServiceSpy.login.and.returnValue(
      throwError(() => ({
        status: 401,
      })),
    );

    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'WrongPassword',
    });

    component.onSubmit();

    expect(component.isLoading).toBeFalse();
  });

  /**
  
  * Verifies that a non-401 error displays the generic connection
  * error.
    */
  it('should display the connection error for a non-401 error', () => {
    authServiceSpy.login.and.returnValue(
      throwError(() => ({
        status: 500,
      })),
    );

    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'Password123!',
    });

    component.onSubmit();

    expect(component.errorMessage).toBe(
      'Unable to connect to the authentication server. Please try again.',
    );
  });

  /**
  
  * Verifies that an error without an HTTP status is treated as a
  * general authentication-server error.
    */
  it('should display the connection error when the error has no HTTP status', () => {
    authServiceSpy.login.and.returnValue(
      throwError(() => new Error('Network error')),
    );

    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'Password123!',
    });

    component.onSubmit();

    expect(component.errorMessage).toBe(
      'Unable to connect to the authentication server. Please try again.',
    );
  });

  /**
  
  * Verifies that a general authentication error stops loading.
    */
  it('should stop loading after a general authentication error', () => {
    authServiceSpy.login.and.returnValue(
      throwError(() => ({
        status: 500,
      })),
    );

    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'Password123!',
    });

    component.onSubmit();

    expect(component.isLoading).toBeFalse();
  });

  /**
  
  * Verifies the current LoginComponent behavior after successful
  * authentication.
  *
  * The current component sets isLoading to true before login and
  * only resets it inside the error callback. The success callback
  * navigates to the dashboard instead.
    */
  it('should keep the loading state unchanged by the success callback', () => {
    authServiceSpy.login.and.returnValue(of(loginResponse));

    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'Password123!',
    });

    component.onSubmit();

    expect(component.isLoading).toBeTrue();
  });

  /**
  
  * Verifies that an invalid submission does not clear an existing
  * error message because onSubmit() returns before reaching the
  * error-clearing logic.
    */
  it('should preserve the existing error message when submitting an invalid form', () => {
    component.errorMessage = 'Previous authentication error.';

    component.loginForm.setValue({
      email: '',
      password: '',
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('Previous authentication error.');
  });
});
