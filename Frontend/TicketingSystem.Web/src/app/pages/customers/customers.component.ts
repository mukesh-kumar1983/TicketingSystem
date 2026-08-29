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
* Supported operations:
* * Load customers.
* * Create customers.
* * Edit customers.
* * Delete customers.
*
* HTTP communication remains delegated to UserService.
*
* User-experience behavior:
* * The create/edit form scrolls into view when opened.
* * Validation errors are displayed inside the form.
* * Create/update API errors are displayed inside the form.
* * List/delete errors are displayed at page level.
* * Success and error messages disappear automatically after four seconds.
* * Timers are cleaned up when the component is destroyed.
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
  
  * Error message displayed to the administrator.
    */
  errorMessage = '';

  /**
  
  * Success message displayed to the administrator.
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
  
  * Indicates that the form should be scrolled into view after rendering.
    */
  private scrollFormIntoView = false;

  /**
  
  * Timer used to automatically clear success/error messages.
    */
  private messageTimer: ReturnType<typeof setTimeout> | null = null;

  /**
  
  * Customer form model.
  *
  * The Customers page always uses the Customer role.
    */
  form: CreateUserRequest = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Customer',
  };

  /**
  
  * Creates the CustomersComponent.
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
  * The form is conditionally rendered, so scrolling must happen after
  * Angular has created the corresponding DOM element.
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
      next: (customers: UserResponse[]) => {
        this.customers = customers;
        this.isLoading = false;
      },

      error: (error: unknown) => {
        console.error('Unable to load customers.', error);

        this.isLoading = false;

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
  * The customer's email is copied exactly as supplied by UserService.
  * No Markdown or mailto conversion is performed.
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
  
  * Creates a new customer or updates the currently selected customer.
    */
  saveCustomer(): void {
    this.clearMessages();

    /*


      
 * An edit operation cannot proceed without the customer identifier.
 *
 * This check is deliberately performed before form validation because
 * the component must report the missing identifier deterministically.
 */
    if (this.isEditing && !this.editingCustomerId) {
      this.showError(
        'Unable to determine which customer should be updated.',
        true,
      );

      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.isSaving = true;

    if (this.isEditing) {
      this.updateCustomer();
      return;
    }

    this.createCustomer();
  }

  /**
  
  * Creates a new customer.
    */
  private createCustomer(): void {
    /*
  
    * CreateUserRequest requires role.
    *
    * The existing UserService customer-create method accepts only the
    * fields required by the existing customer API contract. Therefore,
    * role is used for the strongly typed form but is not sent separately
    * by this component.
      */
    const typedRequest: CreateUserRequest = {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      email: this.form.email.trim(),
      password: this.form.password,
      role: 'Customer',
    };

    const request = {
      firstName: typedRequest.firstName,
      lastName: typedRequest.lastName,
      email: typedRequest.email,
      password: typedRequest.password,
    };

    this.userService.createCustomer(request).subscribe({
      next: () => {
        this.isSaving = false;
        this.showForm = false;

        this.resetForm();

        this.showSuccess('Customer created successfully.');

        this.loadCustomers();
      },

      error: (error: unknown) => {
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
  *
  * The password is intentionally not included in the update request.
    */
  private updateCustomer(): void {
    const customerId = this.editingCustomerId;

    /*


      
 * Defensive check in addition to the check performed by saveCustomer().
 */
    if (!customerId) {
      this.isSaving = false;

      this.showError(
        'Unable to determine which customer should be updated.',
        true,
      );

      return;
    }

    /*
     * UpdateUserRequest requires role.
     *
     * The existing UserService customer-update method accepts the existing
     * customer update payload without a password or role field.
     */
    const typedRequest: UpdateUserRequest = {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      email: this.form.email.trim(),
      role: 'Customer',
    };

    const request = {
      firstName: typedRequest.firstName,
      lastName: typedRequest.lastName,
      email: typedRequest.email,
    };

    this.userService.updateCustomer(customerId, request).subscribe({
      next: () => {
        this.isSaving = false;
        this.showForm = false;

        this.resetForm();

        this.showSuccess('Customer updated successfully.');

        this.loadCustomers();
      },

      error: (error: unknown) => {
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
          (item: UserResponse) => item.id !== customer.id,
        );

        this.isDeleting = false;
        this.deletingUserId = null;

        this.showSuccess('Customer deleted successfully.');
      },

      error: (error: unknown) => {
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
    const firstName = this.form.firstName.trim();

    if (!firstName) {
      this.showError('First name is required.', true);
      return false;
    }

    const lastName = this.form.lastName.trim();

    if (!lastName) {
      this.showError('Last name is required.', true);
      return false;
    }

    const email = this.form.email.trim();

    if (!email) {
      this.showError('Email address is required.', true);
      return false;
    }

    if (!this.isValidEmail(email)) {
      this.showError('Please enter a valid email address.', true);
      return false;
    }

    this.form.firstName = firstName;
    this.form.lastName = lastName;
    this.form.email = email;

    /*
     * Password is required only when creating a customer.
     *
     * Existing customer passwords are never sent during an update.
     */
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
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

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
  * @param message Message to display.
  * @param scrollToFormAfterRender Whether the form should be scrolled into
  * view after Angular renders it.
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
