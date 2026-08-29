import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../models/authentication.models';
import { FooterComponent } from '../../shared/components/footer/footer.component';

/**

* ============================================================================
* TicketingSystem - Login Component
* ============================================================================
*
* Provides the user interface used to authenticate against the
* TicketingSystem API.
*
* Responsibilities:
*
* * Validate login credentials.
* * Submit credentials to AuthService.
* * Display authentication errors.
* * Display a loading state while authentication is in progress.
* * Allow the user to show or hide the password.
* * Provide accessible visual feedback for focused and invalid fields.
* * Display the shared application footer.
*
* ============================================================================
  */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FooterComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  /**

  * Indicates whether a login request is currently being processed.
    */
  isLoading = false;

  /**
  
  * Controls whether the password is displayed as plain text.
  *
  * False:
  * Password is hidden.
  *
  * True:
  * Password is visible.
    */
  showPassword = false;

  /**
  
  * Contains an authentication error returned by the API or an
  * HTTP/network error.
    */
  errorMessage = '';

  /**
  
  * Contains the form control that currently has focus.
  *
  * This is used only for presentation purposes so the input wrapper can
  * provide a consistent visual focus state.
    */
  focusedControl: FormControl<string> | null = null;

  /**
  
  * Reactive form containing the user's authentication credentials.
    */
  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  /**
  
  * Creates an instance of LoginComponent.
  *
  * @param formBuilder Angular reactive-form builder.
  * @param authService Application authentication service.
  * @param router Angular router used after successful authentication.
    */
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  /**
  
  * Authenticates the user using the credentials entered into
  * the login form.
  *
  * When the form is invalid, all controls are marked as touched so the
  * appropriate validation messages are displayed.
  *
  * When authentication succeeds, AuthService stores the authentication
  * information and the user is redirected to the dashboard.
    */
  onSubmit(): void {
    /**
  
    * Prevent submission when the form is invalid.
      */
    if (this.loginForm.invalid) {
      /**
  
      * Mark all controls as touched so validation messages become
      * visible to the user.
        */
      this.loginForm.markAllAsTouched();

      return;
    }

    /**


      
 * Clear any previous authentication error.
 */
    this.errorMessage = '';

    /**
     * Indicate that the authentication request is in progress.
     */
    this.isLoading = true;

    /**
     * Build the request expected by the backend LoginRequest DTO.
     */
    const request: LoginRequest = {
      email: this.loginForm.controls.email.value,
      password: this.loginForm.controls.password.value,
    };

    /**
     * Send the credentials to the authentication API.
     */
    this.authService.login(request).subscribe({
      /**
       * Login succeeded.
       */
      next: () => {
        /**
         * Authentication information has already been stored by
         * AuthService.
         *
         * Navigate the authenticated user to the dashboard.
         */
        this.router.navigate(['/dashboard']);
      },

      /**
       * Login failed.
       */
      error: (error) => {
        /**
         * Stop displaying the loading state.
         */
        this.isLoading = false;

        /**
         * Display a friendly authentication error.
         *
         * The backend deliberately returns a generic authentication
         * message so that we don't expose whether an email exists.
         */
        if (error.status === 401) {
          this.errorMessage = 'Invalid email address or password.';
        } else if (error.status === 403) {
          this.errorMessage =
            'You do not have permission to access the application.';
        } else if (error.status === 0) {
          this.errorMessage =
            'Unable to connect to the authentication server. Please check that the API is running and try again.';
        } else {
          this.errorMessage =
            error.error?.detail ??
            error.error?.message ??
            error.error?.title ??
            'Unable to sign in. Please try again.';
        }
      },
    });
  }

  /**
  
  * Toggles password visibility.
  *
  * This changes only the presentation of the password field and does not
  * modify the value stored in the reactive form.
    */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
