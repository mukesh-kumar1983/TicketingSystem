import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
} from '../../models/user.models';

import { UserService } from '../../core/services/user.service';

/**
 * ============================================================================
 * TicketingSystem - Agents Component
 * ============================================================================
 *
 * Provides the administration interface for Support Agent accounts.
 *
 * Administrators can:
 *
 * - View support agents.
 * - Create support agents.
 * - Edit support agents.
 * - Delete support agents.
 *
 * User-experience behavior:
 *
 * - The create/edit form automatically scrolls into view when opened.
 * - Validation errors are displayed inside the form.
 * - API errors from create/update operations are displayed inside the form.
 * - Delete/list errors are displayed at the page level.
 * - Success and error messages automatically disappear after four seconds.
 * - The message timer is cleaned up when the component is destroyed.
 *
 * HTTP communication is delegated to UserService.
 * ============================================================================
 */
@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agents.component.html',
  styleUrl: './agents.component.scss',
})
export class AgentsComponent implements OnInit, AfterViewChecked, OnDestroy {
  /**
   * Reference to the create/edit form container.
   *
   * Angular populates this reference after the form has been rendered.
   */
  @ViewChild('formContainer')
  formContainer?: ElementRef<HTMLElement>;

  /**
   * Collection of SupportAgent accounts returned by the API.
   */
  agents: UserResponse[] = [];

  /**
   * Indicates whether agent data is currently being loaded.
   */
  isLoading = false;

  /**
   * Indicates whether a create/update operation is currently running.
   */
  isSaving = false;

  /**
   * Indicates whether a delete operation is currently running.
   */
  isDeleting = false;

  /**
   * Identifier of the user currently being deleted.
   */
  deletingUserId: string | null = null;

  /**
   * Stores an error message displayed to the administrator.
   *
   * When the create/edit form is open, the message is displayed inside
   * the form.
   *
   * When the form is closed, the message is displayed at page level.
   */
  errorMessage = '';

  /**
   * Stores a success message displayed to the administrator.
   */
  successMessage = '';

  /**
   * Controls whether the create/edit form is visible.
   */
  showForm = false;

  /**
   * Indicates whether the form is editing an existing support agent.
   */
  isEditing = false;

  /**
   * Identifier of the support agent currently being edited.
   */
  editingAgentId: string | null = null;

  /**
   * Indicates that the form should be scrolled into view after Angular
   * renders it.
   */
  private scrollFormIntoView = false;

  /**
   * Timer used to automatically clear success/error messages.
   */
  private messageTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Support Agent form model.
   */
  form: CreateUserRequest = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'SupportAgent',
  };

  /**
   * Creates an instance of AgentsComponent.
   *
   * @param userService Service responsible for user-management API calls.
   */
  constructor(private readonly userService: UserService) {}

  /**
   * Initializes the Support Agents page.
   */
  ngOnInit(): void {
    this.loadAgents();
  }

  /**
   * Handles Angular's view-check lifecycle.
   *
   * Angular must render the form before the ViewChild reference becomes
   * available. Once available, the form is scrolled into view.
   */
  ngAfterViewChecked(): void {
    if (!this.scrollFormIntoView || !this.formContainer) {
      return;
    }

    this.scrollFormIntoView = false;

    setTimeout(() => {
      this.scrollToFormElement();
    });
  }

  /**
   * Cleans up resources when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.clearMessageTimer();
  }

  /**
   * Loads all SupportAgent accounts from the backend.
   */
  loadAgents(): void {
    this.isLoading = true;

    this.userService.getAgents().subscribe({
      next: (agents) => {
        this.agents = agents;
        this.isLoading = false;
      },

      error: (error) => {
        console.error('Failed to load support agents.', error);

        this.isLoading = false;

        /*
         * Loading errors are page-level errors and should not attempt to
         * scroll to the create/edit form.
         */
        this.showError(
          this.getErrorMessage(
            error,
            'Unable to load support agents. Please try again.',
          ),
          false,
        );
      },
    });
  }

  /**
   * Refreshes the Support Agent collection.
   */
  refresh(): void {
    this.loadAgents();
  }

  /**
   * Opens the form for creating a new Support Agent.
   */
  openCreateForm(): void {
    this.clearMessages();

    this.resetForm();

    this.isEditing = false;
    this.editingAgentId = null;

    this.showForm = true;
    this.scrollFormIntoView = true;
  }

  /**
   * Opens the form for editing an existing Support Agent.
   *
   * @param agent Support Agent to edit.
   */
  openEditForm(agent: UserResponse): void {
    this.clearMessages();

    this.isEditing = true;
    this.editingAgentId = agent.id;

    this.form = {
      firstName: agent.firstName,
      lastName: agent.lastName,
      email: agent.email,
      password: '',
      role: 'SupportAgent',
    };

    this.showForm = true;
    this.scrollFormIntoView = true;
  }

  /**
   * Closes the create/edit form.
   */
  closeForm(): void {
    if (this.isSaving) {
      return;
    }

    this.showForm = false;

    this.resetForm();

    this.clearMessages();

    this.scrollFormIntoView = false;
  }

  /**
   * Creates a new Support Agent or updates the currently edited agent.
   */
  saveAgent(): void {
    this.clearMessages();

    if (!this.validateForm()) {
      return;
    }

    this.isSaving = true;

    if (this.isEditing && this.editingAgentId) {
      this.updateAgent();
      return;
    }

    this.createAgent();
  }

  /**
   * Creates a new Support Agent.
   */
  private createAgent(): void {
    const request: CreateUserRequest = {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      email: this.form.email.trim(),
      password: this.form.password,
      role: 'SupportAgent',
    };

    this.userService.createAgent(request).subscribe({
      next: () => {
        this.isSaving = false;

        this.showForm = false;

        this.resetForm();

        this.showSuccess('Support agent created successfully.');

        this.loadAgents();
      },

      error: (error) => {
        console.error('Unable to create support agent.', error);

        this.isSaving = false;

        this.showError(
          this.getErrorMessage(
            error,
            'Unable to create support agent. Please try again.',
          ),
          true,
        );
      },
    });
  }

  /**
   * Updates the currently selected Support Agent.
   */
  private updateAgent(): void {
    const agentId = this.editingAgentId;

    if (!agentId) {
      this.isSaving = false;

      this.showError(
        'Unable to determine which support agent should be updated.',
        true,
      );

      return;
    }

    const request: UpdateUserRequest = {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      email: this.form.email.trim(),
      role: 'SupportAgent',
    };

    this.userService.updateAgent(agentId, request).subscribe({
      next: () => {
        this.isSaving = false;

        this.showForm = false;

        this.resetForm();

        this.showSuccess('Support agent updated successfully.');

        this.loadAgents();
      },

      error: (error) => {
        console.error('Unable to update support agent.', error);

        this.isSaving = false;

        this.showError(
          this.getErrorMessage(
            error,
            'Unable to update support agent. Please try again.',
          ),
          true,
        );
      },
    });
  }

  /**
   * Deletes a Support Agent after administrator confirmation.
   *
   * @param agent Support Agent to delete.
   */
  deleteAgent(agent: UserResponse): void {
    const displayName = this.getDisplayName(agent);

    const confirmed = window.confirm(
      `Are you sure you want to delete ${displayName}?`,
    );

    if (!confirmed) {
      return;
    }

    this.clearMessages();

    this.isDeleting = true;
    this.deletingUserId = agent.id;

    this.userService.deleteUser(agent.id).subscribe({
      next: () => {
        this.agents = this.agents.filter((item) => item.id !== agent.id);

        this.isDeleting = false;
        this.deletingUserId = null;

        this.showSuccess('Support agent deleted successfully.');
      },

      error: (error) => {
        console.error('Failed to delete support agent.', error);

        this.isDeleting = false;
        this.deletingUserId = null;

        this.showError(
          this.getErrorMessage(
            error,
            'Unable to delete the support agent. Please try again.',
          ),
          false,
        );
      },
    });
  }

  /**
   * Determines whether the specified agent is currently being deleted.
   *
   * @param agent SupportAgent account.
   * @returns True when this agent is being deleted.
   */
  isDeletingAgent(agent: UserResponse): boolean {
    return this.isDeleting && this.deletingUserId === agent.id;
  }

  /**
   * Returns the display name of an agent.
   *
   * @param agent SupportAgent account.
   * @returns The agent's full name.
   */
  getDisplayName(agent: UserResponse): string {
    return `${agent.firstName} ${agent.lastName}`.trim();
  }

  /**
   * Returns the first letter of an agent's display name.
   *
   * @param agent SupportAgent account.
   * @returns Uppercase first character of the agent's name.
   */
  getInitial(agent: UserResponse): string {
    return this.getDisplayName(agent).charAt(0).toUpperCase();
  }

  /**
   * Validates the Support Agent form before submitting it.
   *
   * @returns True when the form is valid.
   */
  private validateForm(): boolean {
    if (!this.form.firstName.trim()) {
      this.showError('First name is required.', true);
      return false;
    }

    if (!this.form.lastName.trim()) {
      this.showError('Last name is required.', true);
      return false;
    }

    if (!this.form.email.trim()) {
      this.showError('Email address is required.', true);
      return false;
    }

    if (!this.isValidEmail(this.form.email.trim())) {
      this.showError('Please enter a valid email address.', true);
      return false;
    }

    if (!this.isEditing && !this.form.password) {
      this.showError('Password is required.', true);
      return false;
    }

    if (!this.isEditing && this.form.password.length < 8) {
      this.showError('Password must contain at least 8 characters.', true);
      return false;
    }

    return true;
  }

  /**
   * Validates an email address using a practical application-level format.
   *
   * @param email Email address to validate.
   * @returns True when the email has a valid application-level format.
   */
  private isValidEmail(email: string): boolean {
    const emailPattern =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    return emailPattern.test(email);
  }

  /**
   * Resets the Support Agent form.
   */
  private resetForm(): void {
    this.form = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'SupportAgent',
    };

    this.isEditing = false;
    this.editingAgentId = null;
  }

  /**
   * Displays a success message.
   *
   * Success messages automatically disappear after four seconds.
   *
   * @param message Message to display.
   */
  private showSuccess(message: string): void {
    this.clearMessageTimer();

    this.errorMessage = '';
    this.successMessage = message;

    this.startMessageTimer();
  }

  /**
   * Displays an error message.
   *
   * When the error belongs to a form operation, the form is automatically
   * scrolled into view.
   *
   * @param message Message to display.
   * @param scrollToFormAfterRender Whether the form should be scrolled into
   * view.
   */
  private showError(message: string, scrollToFormAfterRender: boolean): void {
    this.clearMessageTimer();

    this.successMessage = '';
    this.errorMessage = message;

    if (scrollToFormAfterRender && this.showForm) {
      this.scrollFormIntoView = true;
    }

    this.startMessageTimer();
  }

  /**
   * Starts the automatic message dismissal timer.
   */
  private startMessageTimer(): void {
    this.clearMessageTimer();

    this.messageTimer = setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
      this.messageTimer = null;
    }, 4000);
  }

  /**
   * Clears the currently running message timer.
   */
  private clearMessageTimer(): void {
    if (this.messageTimer !== null) {
      clearTimeout(this.messageTimer);
      this.messageTimer = null;
    }
  }

  /**
   * Clears success and error messages.
   */
  private clearMessages(): void {
    this.clearMessageTimer();

    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Scrolls the currently rendered form into view.
   */
  private scrollToFormElement(): void {
    this.formContainer?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  /**
   * Extracts a useful error message from an HTTP error response.
   *
   * @param error HTTP error returned by Angular.
   * @param fallback Default message.
   * @returns User-friendly error message.
   */
  private getErrorMessage(error: unknown, fallback: string): string {
    const httpError = error as {
      error?: {
        message?: string;
        title?: string;
      };
      message?: string;
    };

    return (
      httpError?.error?.message ??
      httpError?.error?.title ??
      httpError?.message ??
      fallback
    );
  }
}
