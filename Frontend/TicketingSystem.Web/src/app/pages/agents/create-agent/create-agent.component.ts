import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { UserService } from '../../../core/services/user.service';

/**
 * ============================================================================
 * TicketingSystem - Create Agent Component
 * ============================================================================
 *
 * Provides the administration screen for creating a new SupportAgent account.
 *
 * The component deliberately does not ask the administrator to select a role.
 * The role is automatically assigned by UserService.createAgent().
 *
 * This ensures that the screen cannot accidentally create a Customer instead
 * of a SupportAgent.
 * ============================================================================
 */
@Component({
  selector: 'app-create-agent',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-agent.component.html',
  styleUrl: './create-agent.component.scss',
})
export class CreateAgentComponent {
  /**
   * Indicates whether the create operation is currently running.
   */
  isSubmitting = false;

  /**
   * Error message displayed when the API rejects the request.
   */
  errorMessage = '';

  /**
   * Reactive form used to collect the new agent's information.
   */
  readonly agentForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],

    lastName: ['', [Validators.required, Validators.maxLength(100)]],

    email: [
      '',
      [Validators.required, Validators.email, Validators.maxLength(256)],
    ],

    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  /**
   * Creates an instance of CreateAgentComponent.
   *
   * @param formBuilder Angular reactive-form builder.
   * @param userService Service responsible for user-management API calls.
   * @param router Angular router used for navigation after creation.
   */
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly userService: UserService,
    private readonly router: Router,
  ) {}

  /**
   * Creates a new SupportAgent account.
   */
  createAgent(): void {
    this.errorMessage = '';

    if (this.agentForm.invalid) {
      this.agentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const request = this.agentForm.getRawValue();

    this.userService.createAgent(request).subscribe({
      next: () => {
        this.isSubmitting = false;

        this.router.navigate(['/agents']);
      },

      error: (error) => {
        console.error('Unable to create support agent.', error);

        this.errorMessage =
          error?.error?.message ??
          'Unable to create the support agent. Please check the information and try again.';

        this.isSubmitting = false;
      },
    });
  }

  /**
   * Determines whether a form control contains a validation error that
   * should currently be displayed.
   *
   * @param controlName Name of the form control.
   * @returns True when the control has been touched and is invalid.
   */
  hasError(
    controlName: 'firstName' | 'lastName' | 'email' | 'password',
  ): boolean {
    const control = this.agentForm.controls[controlName];

    return control.invalid && control.touched;
  }
}
