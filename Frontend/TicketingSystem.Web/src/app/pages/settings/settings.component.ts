import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

import {
  CurrentUser,
  UpdateCurrentUserRequest,
} from '../../models/authentication.models';

/**
 * ============================================================================
 * TicketingSystem - Settings Component
 * ============================================================================
 *
 * Provides the authenticated user's Settings page.
 *
 * Responsibilities:
 *
 * - Display the currently authenticated user's profile.
 * - Retrieve the authoritative profile from the backend.
 * - Allow the authenticated user to edit first name, last name and email.
 * - Validate profile information on the client side.
 * - Submit profile changes through AuthService.
 * - Keep the local authenticated-user cache synchronized.
 * - Display toast notifications for success and failure.
 * - Provide logout functionality.
 *
 * Backend endpoints used by this component:
 *
 * GET /api/Auth/me
 *
 * PUT /api/Auth/me
 * ============================================================================
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  /**
   * Contains the currently authenticated user's information.
   *
   * The value is initially populated from localStorage so the page can
   * display cached information immediately while the backend request runs.
   */
  currentUser: CurrentUser | null = null;

  /**
   * Reactive form used to edit the authenticated user's profile.
   */
  profileForm: FormGroup;

  /**
   * Indicates whether the current-user information is being loaded.
   */
  isLoading = false;

  /**
   * Indicates whether the profile update request is being submitted.
   */
  isSaving = false;

  /**
   * Indicates whether profile editing mode is currently active.
   */
  isEditing = false;

  /**
   * Creates an instance of SettingsComponent.
   *
   * @param formBuilder Angular reactive-form builder.
   * @param authService Authentication and current-user service.
   * @param toastService Global application toast notification service.
   */
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
  ) {
    /**
     * Retrieve cached user information first.
     *
     * This allows the Settings page to render useful information immediately
     * instead of waiting for the API request to complete.
     */
    this.currentUser = this.authService.getStoredCurrentUser();

    /**
     * Create the profile-editing form.
     *
     * The form contains only fields that the authenticated user is allowed
     * to edit through the profile endpoint.
     */
    this.profileForm = this.formBuilder.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],

      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],

      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(256)],
      ],
    });
  }

  /**
   * Initializes the Settings page.
   *
   * Cached information is loaded into the form first and then the backend
   * is queried to ensure that the displayed information is authoritative.
   */
  ngOnInit(): void {
    /**
     * Populate the form from the cached user when available.
     */
    this.populateForm();

    /**
     * Retrieve the latest profile from the backend.
     */
    this.loadCurrentUser();
  }

  /**
   * Retrieves the currently authenticated user from the backend.
   *
   * The authentication interceptor is responsible for attaching the JWT
   * access token to the HTTP request.
   */
  loadCurrentUser(): void {
    /**
     * Do not start another profile request while one is already running.
     */
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.authService.getCurrentUser().subscribe({
      /**
       * Handles a successful backend response.
       *
       * @param user Current authenticated user returned by the API.
       */
      next: (user) => {
        /**
         * Replace the cached profile with the authoritative backend data.
         */
        this.currentUser = user;

        /**
         * Synchronize the profile form with the latest user information.
         */
        this.populateForm();

        /**
         * Finish the loading operation.
         */
        this.isLoading = false;
      },

      /**
       * Handles a failed backend response.
       *
       * @param error HTTP error returned by Angular HttpClient.
       */
      error: (error) => {
        /**
         * Finish the loading operation.
         */
        this.isLoading = false;

        /**
         * A 401 means that the JWT is no longer accepted by the backend.
         */
        if (error.status === 401) {
          this.toastService.error(
            'Your session has expired. Please sign in again.',
          );

          return;
        }

        /**
         * Display a generic error for all other failures.
         */
        this.toastService.error(
          'Unable to load your profile information. Please try again.',
        );
      },
    });
  }

  /**
   * Opens profile editing mode.
   *
   * The form is populated again from the current profile so that entering
   * edit mode always starts with the latest displayed values.
   */
  startEditing(): void {
    /**
     * Do not allow editing while the profile is still loading.
     */
    if (this.isLoading || this.isSaving) {
      return;
    }

    /**
     * Reset the form to the current profile values.
     */
    this.populateForm();

    /**
     * Display the editing form.
     */
    this.isEditing = true;
  }

  /**
   * Cancels profile editing.
   *
   * Any unsaved changes are discarded and the form is restored to the
   * currently loaded user's information.
   */
  cancelEditing(): void {
    /**
     * Do not cancel while a save request is in progress.
     */
    if (this.isSaving) {
      return;
    }

    /**
     * Restore the original profile values.
     */
    this.populateForm();

    /**
     * Return to read-only mode.
     */
    this.isEditing = false;
  }

  /**
   * Saves the profile changes.
   *
   * The request is sent to:
   *
   * PUT /api/Auth/me
   */
  saveProfile(): void {
    /**
     * Prevent duplicate submissions.
     */
    if (this.isSaving) {
      return;
    }

    /**
     * Mark every control as touched so validation messages become visible.
     */
    this.profileForm.markAllAsTouched();

    /**
     * Do not send invalid data to the backend.
     */
    if (this.profileForm.invalid) {
      this.toastService.error(
        'Please correct the highlighted profile information.',
      );

      return;
    }

    /**
     * Read and trim the form values.
     */
    const firstName = String(
      this.profileForm.get('firstName')?.value ?? '',
    ).trim();

    const lastName = String(
      this.profileForm.get('lastName')?.value ?? '',
    ).trim();

    const email = String(this.profileForm.get('email')?.value ?? '').trim();

    /**
     * Build the request expected by the backend.
     */
    const request: UpdateCurrentUserRequest = {
      firstName,
      lastName,
      email,
    };

    /**
     * Prevent additional changes while the request is being processed.
     */
    this.isSaving = true;

    /**
     * Send the profile update to the backend.
     */
    this.authService.updateCurrentUser(request).subscribe({
      /**
       * Handles a successful profile update.
       *
       * @param user Updated user returned by the backend.
       */
      next: (user) => {
        /**
         * Replace the displayed profile with the backend response.
         */
        this.currentUser = user;

        /**
         * Synchronize the form with the saved values.
         */
        this.populateForm();

        /**
         * Leave editing mode.
         */
        this.isEditing = false;

        /**
         * Finish the save operation.
         */
        this.isSaving = false;

        /**
         * Inform the user that the operation succeeded.
         */
        this.toastService.success(
          'Your profile has been updated successfully.',
        );
      },

      /**
       * Handles a failed profile update.
       *
       * @param error HTTP error returned by Angular HttpClient.
       */
      error: (error) => {
        /**
         * Allow the user to attempt the operation again.
         */
        this.isSaving = false;

        /**
         * Bad request generally means that the submitted profile information
         * failed backend validation.
         */
        if (error.status === 400) {
          this.toastService.error(
            this.getApiErrorMessage(
              error,
              'The profile information is invalid.',
            ),
          );

          return;
        }

        /**
         * Unauthorized means that the current authentication token is no
         * longer accepted.
         */
        if (error.status === 401) {
          this.toastService.error(
            'Your session has expired. Please sign in again.',
          );

          return;
        }

        /**
         * Conflict normally means the submitted email is already being used
         * by another Identity user.
         */
        if (error.status === 409) {
          this.toastService.error(
            'That email address is already associated with another account.',
          );

          return;
        }

        /**
         * Display a safe fallback for unexpected server failures.
         */
        this.toastService.error(
          'Unable to update your profile. Please try again.',
        );
      },
    });
  }

  /**
   * Logs the authenticated user out.
   *
   * AuthService removes both the JWT access token and the cached current
   * user information.
   */
  logout(): void {
    /**
     * Clear authentication information.
     */
    this.authService.logout();

    /**
     * Display confirmation to the user.
     */
    this.toastService.info('You have been signed out.');

    /**
     * Navigate to the login page.
     */
    window.location.href = '/login';
  }

  /**
   * Returns the user's display name.
   *
   * @returns The user's full name or a safe fallback.
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
      `${this.currentUser.firstName ?? ''} ${this.currentUser.lastName ?? ''}`.trim();

    return name || 'User';
  }

  /**
   * Returns the first letter of the user's display name.
   *
   * @returns Uppercase profile initial.
   */
  get userInitial(): string {
    return this.userDisplayName.charAt(0).toUpperCase();
  }

  /**
   * Returns the user's application role.
   *
   * @returns Current user's role.
   */
  get userRole(): string {
    return this.currentUser?.role || 'Authenticated';
  }

  /**
   * Indicates whether the authenticated user has administrator privileges.
   *
   * @returns True when the user's role is Admin.
   */
  get isAdministrator(): boolean {
    return this.currentUser?.role === 'Admin';
  }

  /**
   * Determines whether a profile form field should display its validation
   * error.
   *
   * @param controlName Name of the form control.
   * @returns True when the control has been touched and is invalid.
   */
  isFieldInvalid(controlName: string): boolean {
    const control = this.profileForm.get(controlName);

    return !!control && control.invalid && control.touched;
  }

  /**
   * Returns the appropriate validation message for a form field.
   *
   * @param controlName Name of the form control.
   * @returns Human-readable validation message.
   */
  getValidationMessage(controlName: string): string {
    const control = this.profileForm.get(controlName);

    if (!control || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required.';
    }

    if (control.errors['email']) {
      return 'Please enter a valid email address.';
    }

    if (control.errors['minlength']) {
      return 'This field is too short.';
    }

    if (control.errors['maxlength']) {
      return 'This field is too long.';
    }

    return 'Please enter a valid value.';
  }

  /**
   * Populates the profile form using the currently loaded user.
   *
   * The method also resets the form's dirty/touched state because loading
   * existing data should not make the form appear modified.
   */
  private populateForm(): void {
    /**
     * There is nothing to populate when no authenticated user is available.
     */
    if (!this.currentUser) {
      return;
    }

    /**
     * Copy the current user values into the reactive form.
     */
    this.profileForm.patchValue(
      {
        firstName: this.currentUser.firstName ?? '',
        lastName: this.currentUser.lastName ?? '',
        email: this.currentUser.email ?? '',
      },
      {
        emitEvent: false,
      },
    );

    /**
     * Treat the loaded values as the original state of the form.
     */
    this.profileForm.markAsPristine();
    this.profileForm.markAsUntouched();
  }

  /**
   * Extracts a useful message from an API error response.
   *
   * The backend may return:
   *
   * - A plain string.
   * - An object containing `message`.
   * - A ProblemDetails response containing `title`.
   *
   * @param error HTTP error returned by Angular HttpClient.
   * @param fallback Safe fallback message.
   * @returns Human-readable API error message.
   */
  private getApiErrorMessage(error: any, fallback: string): string {
    /**
     * Handle a plain-text API response.
     */
    if (typeof error?.error === 'string' && error.error.trim().length > 0) {
      return error.error;
    }

    /**
     * Handle an API response containing a message property.
     */
    if (
      typeof error?.error?.message === 'string' &&
      error.error.message.trim().length > 0
    ) {
      return error.error.message;
    }

    /**
     * Handle ASP.NET Core ProblemDetails responses.
     */
    if (
      typeof error?.error?.title === 'string' &&
      error.error.title.trim().length > 0
    ) {
      return error.error.title;
    }

    /**
     * Nothing useful was returned by the API.
     */
    return fallback;
  }
}
