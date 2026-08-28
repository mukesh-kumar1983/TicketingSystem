import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../models/authentication.models';

/**
 * Provides the user interface used to authenticate against
 * the TicketingSystem API.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  /**
   * Indicates whether a login request is currently being processed.
   */
  isLoading = false;

  /**
   * Contains an authentication error returned by the API or an
   * HTTP/network error.
   */
  errorMessage = '';

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
        } else {
          this.errorMessage =
            'Unable to connect to the authentication server. Please try again.';
        }
      },

      /**
       * Complete callback.
       *
       * We don't need to change the loading state here because
       * successful and failed requests are handled above.
       */
      complete: () => {},
    });
  }
}
