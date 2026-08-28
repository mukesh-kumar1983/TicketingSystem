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
 * TicketingSystem - Customers Component
 * ============================================================================
 *
 * Provides the administration interface for Customer accounts.
 *
 * Administrators can:
 *
 * - View customers.
 * - Create customers.
 * - Edit customers.
 * - Delete customers.
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
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss',
})
export class CustomersComponent implements OnInit, AfterViewChecked, OnDestroy {
  /**
   * Reference to the create/edit form container.
   *
   * The reference becomes available after Angular renders the form because
   * the form is conditionally displayed using *ngIf.
   */
  @ViewChild('formContainer')
  formContainer?: ElementRef<HTMLElement>;

  /**
   * Collection of customers returned by the backend.
   */
  customers: UserResponse[] = [];

  /**
   * Indicates whether customer data is currently being loaded.
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
   * Identifier of the customer currently being deleted.
   */
  deletingUserId: string | null = null;

  /**
   * Stores an error message displayed to the administrator.
   *
   * When the create/edit form is open, this message is displayed inside
   * the form.
   *
   * When the form is closed, this message is displayed above the form/list.
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
   * Indicates whether the form is editing an existing customer.
   */
  isEditing = false;

  /**
   * Identifier of the customer currently being edited.
   */
  editingCustomerId: string | null = null;

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
   * Customer form model.
   */
  form: CreateUserRequest = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Customer',
  };

  /**
   * Creates an instance of CustomersComponent.
   *
   * @param userService Service used to communicate with the user API.
   */
  constructor(private readonly userService: UserService) {}

  /**
   * Loads customers when the component is initialized.
   */
  ngOnInit(): void {
    this.loadCustomers();
  }

  /**
   * Handles Angular's view-check lifecycle.
   *
   * Angular needs to render the form before the ViewChild reference becomes
   * available. Once it exists, the component scrolls the form into view.
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
   * Retrieves all customers from the backend.
   */
  loadCustomers(): void {
    this.isLoading = true;

    this.userService.getCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.isLoading = false;
      },

      error: (error) => {
        console.error('Unable to load customers.', error);

        this.isLoading = false;

        /*
         * List loading errors are page-level errors. They should not attempt
         * to scroll to the create/edit form.
         */
        this.showError(
          this.getErrorMessage(
            error,
            'Unable to load customers. Please try again.',
          ),
          false,
        );
      },
    });
  }

  /**
   * Opens the form for creating a new customer.
   */
  openCreateForm(): void {
    this.clearMessages();

    this.resetForm();

    this.isEditing = false;
    this.editingCustomerId = null;

    this.showForm = true;
    this.scrollFormIntoView = true;
  }

  /**
   * Opens the form for editing an existing customer.
   *
   * @param customer Customer to edit.
   */
  openEditForm(customer: UserResponse): void {
    this.clearMessages();

    this.isEditing = true;
    this.editingCustomerId = customer.id;

    this.form = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      password: '',
      role: 'Customer',
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
   * Creates a new customer or updates the currently edited customer.
   */
  saveCustomer(): void {
    this.clearMessages();

    if (!this.validateForm()) {
      return;
    }

    this.isSaving = true;

    if (this.isEditing && this.editingCustomerId) {
      this.updateCustomer();
      return;
    }

    this.createCustomer();
  }

  /**
   * Creates a new customer.
   */
  private createCustomer(): void {
    const request: CreateUserRequest = {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      email: this.form.email.trim(),
      password: this.form.password,
      role: 'Customer',
    };

    this.userService.createCustomer(request).subscribe({
      next: () => {
        this.isSaving = false;

        /*
         * Display the success message before closing the form.
         * The message is page-level after the form closes.
         */
        this.showForm = false;

        this.resetForm();

        this.showSuccess('Customer created successfully.');

        this.loadCustomers();
      },

      error: (error) => {
        console.error('Unable to create customer.', error);

        this.isSaving = false;

        this.showError(
          this.getErrorMessage(
            error,
            'Unable to create customer. Please try again.',
          ),
          true,
        );
      },
    });
  }

  /**
   * Updates the currently selected customer.
   */
  private updateCustomer(): void {
    const customerId = this.editingCustomerId;

    if (!customerId) {
      this.isSaving = false;

      this.showError(
        'Unable to determine which customer should be updated.',
        true,
      );

      return;
    }

    const request: UpdateUserRequest = {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      email: this.form.email.trim(),
      role: 'Customer',
    };

    this.userService.updateCustomer(customerId, request).subscribe({
      next: () => {
        this.isSaving = false;

        this.showForm = false;

        this.resetForm();

        this.showSuccess('Customer updated successfully.');

        this.loadCustomers();
      },

      error: (error) => {
        console.error('Unable to update customer.', error);

        this.isSaving = false;

        this.showError(
          this.getErrorMessage(
            error,
            'Unable to update customer. Please try again.',
          ),
          true,
        );
      },
    });
  }

  /**
   * Deletes a customer after administrator confirmation.
   *
   * @param customer Customer to delete.
   */
  deleteCustomer(customer: UserResponse): void {
    const displayName = this.getDisplayName(customer);

    const confirmed = window.confirm(
      `Are you sure you want to delete ${displayName}?`,
    );

    if (!confirmed) {
      return;
    }

    this.clearMessages();

    this.isDeleting = true;
    this.deletingUserId = customer.id;

    this.userService.deleteUser(customer.id).subscribe({
      next: () => {
        this.customers = this.customers.filter(
          (item) => item.id !== customer.id,
        );

        this.isDeleting = false;
        this.deletingUserId = null;

        this.showSuccess('Customer deleted successfully.');
      },

      error: (error) => {
        console.error('Unable to delete customer.', error);

        this.isDeleting = false;
        this.deletingUserId = null;

        this.showError(
          this.getErrorMessage(
            error,
            'Unable to delete customer. Please try again.',
          ),
          false,
        );
      },
    });
  }

  /**
   * Determines whether the specified customer is currently being deleted.
   *
   * @param customer Customer account.
   * @returns True when this customer is being deleted.
   */
  isDeletingCustomer(customer: UserResponse): boolean {
    return this.isDeleting && this.deletingUserId === customer.id;
  }

  /**
   * Returns the customer's display name.
   *
   * @param customer Customer account.
   * @returns Customer's full name.
   */
  getDisplayName(customer: UserResponse): string {
    return `${customer.firstName} ${customer.lastName}`.trim();
  }

  /**
   * Returns the first letter of the customer's display name.
   *
   * @param customer Customer account.
   * @returns Uppercase first character of the customer's name.
   */
  getInitial(customer: UserResponse): string {
    return this.getDisplayName(customer).charAt(0).toUpperCase();
  }

  /**
   * Validates the customer form before submitting it.
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
   * This intentionally checks the structure of the address rather than trying
   * to implement the complete RFC email grammar.
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
   * Resets the customer form to its initial state.
   */
  private resetForm(): void {
    this.form = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'Customer',
    };

    this.isEditing = false;
    this.editingCustomerId = null;
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
   * Clears both success and error messages.
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
