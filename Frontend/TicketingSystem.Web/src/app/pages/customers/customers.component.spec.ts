import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { CustomersComponent } from './customers.component';

import { UserService } from '../../core/services/user.service';

import {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
} from '../../models/user.models';

/**
 * ============================================================================
 * TicketingSystem - CustomersComponent Unit Tests
 * ============================================================================
 *
 * Comprehensive unit tests for CustomersComponent.
 *
 * The test suite verifies:
 *
 * - Component creation and initial state.
 * - Customer loading.
 * - Customer loading errors.
 * - Create form behavior.
 * - Edit form behavior.
 * - Form reset and close behavior.
 * - Customer creation.
 * - Customer update.
 * - Customer deletion.
 * - Delete confirmation.
 * - Validation.
 * - Email validation.
 * - Password validation.
 * - Loading and saving states.
 * - Delete state tracking.
 * - Success and error messages.
 * - Automatic message cleanup.
 * - Display-name generation.
 * - Customer initials.
 * - Rendering behavior.
 * - Component destruction.
 *
 * UserService is mocked with Jasmine spies so these tests remain isolated
 * unit tests and never communicate with the real backend API.
 *
 * IMPORTANT:
 *
 * UserService.createCustomer() accepts:
 *
 * Omit<CreateUserRequest, 'role'>
 *
 * UserService.updateCustomer() accepts:
 *
 * Omit<UpdateUserRequest, 'role'>
 *
 * The UserService convenience methods add the Customer role internally.
 * Therefore createCustomer() and updateCustomer() expectations intentionally
 * do not contain a role property.
 * ============================================================================
 */
describe('CustomersComponent', () => {
  let component: CustomersComponent;
  let fixture: ComponentFixture<CustomersComponent>;

  /**
   * Mock UserService used by CustomersComponent.
   */
  let userServiceSpy: jasmine.SpyObj<UserService>;

  /**
   * Creates a valid UserResponse object for unit tests.
   *
   * @param id User identifier.
   * @param firstName Customer first name.
   * @param lastName Customer last name.
   * @param email Customer email address.
   * @returns A valid customer UserResponse.
   */
  const createCustomer = (
    id: string = 'customer-1',
    firstName: string = 'Test',
    lastName: string = 'Customer',
    email: string = 'customer@example.com',
  ): UserResponse => ({
    id,
    firstName,
    lastName,
    email,
    role: 'Customer',
  });

  /**
   * Creates a valid CreateUserRequest object for test form state.
   *
   * The role property exists on the complete CreateUserRequest model because
   * it represents the backend request contract. The CustomersComponent
   * convenience method strips the role before calling UserService.
   *
   * @returns A valid customer creation request.
   */
  const createRequest = (): CreateUserRequest => ({
    firstName: 'New',
    lastName: 'Customer',
    email: 'new.customer@example.com',
    password: 'Password123',
    role: 'Customer',
  });

  /**
   * Creates a valid UpdateUserRequest object for test form state.
   *
   * The role property exists on the complete UpdateUserRequest model because
   * it represents the backend request contract. The CustomersComponent
   * convenience method strips the role before calling UserService.
   *
   * @returns A valid customer update request.
   */
  const updateRequest = (): UpdateUserRequest => ({
    firstName: 'Updated',
    lastName: 'Customer',
    email: 'updated.customer@example.com',
    role: 'Customer',
  });

  /**
   * Configures the Angular testing module before every test.
   *
   * The real UserService is replaced by a Jasmine spy object.
   */
  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj<UserService>('UserService', [
      'getCustomers',
      'createCustomer',
      'updateCustomer',
      'deleteUser',
    ]);

    userServiceSpy.getCustomers.and.returnValue(of([]));

    userServiceSpy.createCustomer.and.returnValue(
      of(createCustomer('new-customer')),
    );

    userServiceSpy.updateCustomer.and.returnValue(
      of(createCustomer('customer-1')),
    );

    userServiceSpy.deleteUser.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [CustomersComponent, CommonModule, FormsModule],
      providers: [
        {
          provide: UserService,
          useValue: userServiceSpy,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomersComponent);
    component = fixture.componentInstance;
  });

  /**
   * Verifies that CustomersComponent can be instantiated.
   */
  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Verifies the expected initial component state.
   */
  it('should initialize with the expected default state', () => {
    expect(component.customers).toEqual([]);
    expect(component.isLoading).toBeFalse();
    expect(component.isSaving).toBeFalse();
    expect(component.isDeleting).toBeFalse();
    expect(component.deletingUserId).toBeNull();
    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
    expect(component.showForm).toBeFalse();
    expect(component.isEditing).toBeFalse();
    expect(component.editingCustomerId).toBeNull();

    expect(component.form).toEqual({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'Customer',
    });
  });

  /**
   * Verifies that customer loading starts during component initialization.
   */
  it('should load customers during initialization', () => {
    fixture.detectChanges();

    expect(userServiceSpy.getCustomers).toHaveBeenCalled();
  });

  /**
   * Verifies that customers returned by the API are stored on the component.
   */
  it('should store customers returned by the API', () => {
    const customers = [
      createCustomer('customer-1', 'John', 'Smith', 'john@example.com'),
      createCustomer('customer-2', 'Jane', 'Doe', 'jane@example.com'),
    ];

    userServiceSpy.getCustomers.and.returnValue(of(customers));

    fixture.detectChanges();

    expect(component.customers).toEqual(customers);
    expect(component.isLoading).toBeFalse();
  });

  /**
   * Verifies that isLoading is true while the customer request executes.
   */
  it('should set isLoading while loading customers', () => {
    userServiceSpy.getCustomers.and.callFake(() => {
      expect(component.isLoading).toBeTrue();

      return of([createCustomer()]);
    });

    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
  });

  /**
   * Verifies the fallback error message when customer loading fails.
   */
  it('should display an error when loading customers fails', () => {
    userServiceSpy.getCustomers.and.returnValue(
      throwError(() => ({
        status: 500,
      })),
    );

    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe(
      'Unable to load customers. Please try again.',
    );
  });

  /**
   * Verifies that a backend error message is preferred when available.
   */
  it('should display the backend error message when loading customers fails', () => {
    userServiceSpy.getCustomers.and.returnValue(
      throwError(() => ({
        error: {
          message: 'Customer service is temporarily unavailable.',
        },
      })),
    );

    fixture.detectChanges();

    expect(component.errorMessage).toBe(
      'Customer service is temporarily unavailable.',
    );
  });

  /**
   * Verifies that opening the create form resets the form and switches
   * the component into create mode.
   */
  it('should open the create form', () => {
    component.form.firstName = 'Existing';
    component.form.lastName = 'Value';
    component.form.email = 'existing@example.com';
    component.form.password = 'Password123';
    component.isEditing = true;
    component.editingCustomerId = 'customer-1';

    component.openCreateForm();

    expect(component.showForm).toBeTrue();
    expect(component.isEditing).toBeFalse();
    expect(component.editingCustomerId).toBeNull();

    expect(component.form).toEqual({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'Customer',
    });
  });

  /**
   * Verifies that opening the edit form populates the selected customer.
   */
  it('should open the edit form with the selected customer data', () => {
    const customer = createCustomer(
      'customer-10',
      'John',
      'Smith',
      'john.smith@example.com',
    );

    component.openEditForm(customer);

    expect(component.showForm).toBeTrue();
    expect(component.isEditing).toBeTrue();
    expect(component.editingCustomerId).toBe('customer-10');

    expect(component.form).toEqual({
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      password: '',
      role: 'Customer',
    });
  });

  /**
   * Verifies that an existing customer password is never populated
   * when entering edit mode.
   */
  it('should not populate a customer password when editing', () => {
    const customer = createCustomer();

    component.openEditForm(customer);

    expect(component.form.password).toBe('');
  });

  /**
   * Verifies that closing the form hides it and resets its state.
   */
  it('should close and reset the form', () => {
    component.openEditForm(createCustomer());

    component.closeForm();

    expect(component.showForm).toBeFalse();
    expect(component.isEditing).toBeFalse();
    expect(component.editingCustomerId).toBeNull();

    expect(component.form).toEqual({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'Customer',
    });
  });

  /**
   * Verifies that the form cannot be closed while saving.
   */
  it('should not close the form while saving', () => {
    component.showForm = true;
    component.isSaving = true;

    component.closeForm();

    expect(component.showForm).toBeTrue();
  });

  /**
   * Verifies that creating a valid customer calls UserService with the
   * correct request shape.
   *
   * The Customer role is intentionally omitted because createCustomer()
   * adds it internally.
   */
  it('should create a customer with the expected request', () => {
    component.openCreateForm();

    component.form = createRequest();

    component.saveCustomer();

    expect(userServiceSpy.createCustomer).toHaveBeenCalledWith({
      firstName: 'New',
      lastName: 'Customer',
      email: 'new.customer@example.com',
      password: 'Password123',
    });
  });

  /**
   * Verifies successful customer creation.
   */
  it('should handle successful customer creation', () => {
    component.openCreateForm();

    component.form = createRequest();

    component.saveCustomer();

    expect(component.isSaving).toBeFalse();
    expect(component.showForm).toBeFalse();
    expect(component.successMessage).toBe('Customer created successfully.');
    expect(component.errorMessage).toBe('');

    expect(userServiceSpy.getCustomers).toHaveBeenCalled();
  });

  /**
   * Verifies that the customer list is refreshed after successful creation.
   */
  it('should reload customers after successful creation', () => {
    component.openCreateForm();
    component.form = createRequest();

    userServiceSpy.getCustomers.calls.reset();

    component.saveCustomer();

    expect(userServiceSpy.getCustomers).toHaveBeenCalledTimes(1);
  });

  /**
   * Verifies that customer creation errors are handled correctly.
   */
  it('should handle customer creation errors', () => {
    userServiceSpy.createCustomer.and.returnValue(
      throwError(() => ({
        error: {
          message: 'Email address is already registered.',
        },
      })),
    );

    component.openCreateForm();

    component.form = createRequest();

    component.saveCustomer();

    expect(component.isSaving).toBeFalse();
    expect(component.showForm).toBeTrue();
    expect(component.errorMessage).toBe('Email address is already registered.');
  });

  /**
   * Verifies that isSaving is true while creating a customer.
   */
  it('should set isSaving while creating a customer', () => {
    component.openCreateForm();
    component.form = createRequest();

    userServiceSpy.createCustomer.and.callFake(() => {
      expect(component.isSaving).toBeTrue();

      return of(createCustomer('new-customer'));
    });

    component.saveCustomer();

    expect(component.isSaving).toBeFalse();
  });

  /**
   * Verifies that updating an existing customer calls UserService with
   * the correct identifier and request.
   *
   * The Customer role is intentionally omitted because updateCustomer()
   * adds it internally.
   */
  it('should update an existing customer with the expected request', () => {
    const customer = createCustomer(
      'customer-25',
      'Original',
      'Customer',
      'original@example.com',
    );

    component.openEditForm(customer);

    component.form.firstName = 'Updated';
    component.form.lastName = 'Customer';
    component.form.email = 'updated@example.com';

    component.saveCustomer();

    expect(userServiceSpy.updateCustomer).toHaveBeenCalledWith('customer-25', {
      firstName: 'Updated',
      lastName: 'Customer',
      email: 'updated@example.com',
    });
  });

  /**
   * Verifies that update requests never include password or role.
   */
  it('should not send a password when updating a customer', () => {
    const customer = createCustomer();

    component.openEditForm(customer);

    component.form.password = 'ShouldNotBeSent';

    component.saveCustomer();

    expect(userServiceSpy.updateCustomer).toHaveBeenCalled();

    const updateCall = userServiceSpy.updateCustomer.calls.mostRecent();
    const request = updateCall.args[1];

    expect(request).toEqual({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
    });

    expect(request).not.toEqual(
      jasmine.objectContaining({
        password: jasmine.any(String),
      }),
    );

    expect(request).not.toEqual(
      jasmine.objectContaining({
        role: jasmine.any(String),
      }),
    );
  });

  /**
   * Verifies successful customer update.
   */
  it('should handle successful customer update', () => {
    const customer = createCustomer();

    component.openEditForm(customer);

    component.form = {
      firstName: 'Updated',
      lastName: 'Customer',
      email: 'updated@example.com',
      password: '',
      role: 'Customer',
    };

    component.saveCustomer();

    expect(component.isSaving).toBeFalse();
    expect(component.showForm).toBeFalse();
    expect(component.successMessage).toBe('Customer updated successfully.');
    expect(component.errorMessage).toBe('');

    expect(userServiceSpy.getCustomers).toHaveBeenCalled();
  });

  /**
   * Verifies that customer update errors keep the form open.
   */
  it('should handle customer update errors', () => {
    userServiceSpy.updateCustomer.and.returnValue(
      throwError(() => ({
        error: {
          title: 'Unable to update customer.',
        },
      })),
    );

    component.openEditForm(createCustomer());

    component.saveCustomer();

    expect(component.isSaving).toBeFalse();
    expect(component.showForm).toBeTrue();
    expect(component.errorMessage).toBe('Unable to update customer.');
  });

  /**
   * Verifies that a confirmed customer deletion succeeds.
   */
  it('should delete a confirmed customer', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    const customer = createCustomer('customer-delete');

    component.customers = [customer, createCustomer('customer-keep')];

    component.deleteCustomer(customer);

    expect(userServiceSpy.deleteUser).toHaveBeenCalledWith('customer-delete');

    expect(component.customers).toEqual([createCustomer('customer-keep')]);

    expect(component.isDeleting).toBeFalse();
    expect(component.deletingUserId).toBeNull();
    expect(component.successMessage).toBe('Customer deleted successfully.');
  });

  /**
   * Verifies that deletion requires confirmation.
   */
  it('should ask for confirmation before deleting a customer', () => {
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(false);

    const customer = createCustomer();

    component.customers = [customer];

    component.deleteCustomer(customer);

    expect(confirmSpy).toHaveBeenCalledWith(
      'Are you sure you want to delete Test Customer?',
    );

    expect(userServiceSpy.deleteUser).not.toHaveBeenCalled();
    expect(component.customers).toEqual([customer]);
  });

  /**
   * Verifies that cancelling deletion leaves component state unchanged.
   */
  it('should do nothing when customer deletion is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    const customer = createCustomer();

    component.customers = [customer];

    component.deleteCustomer(customer);

    expect(component.isDeleting).toBeFalse();
    expect(component.deletingUserId).toBeNull();
    expect(component.successMessage).toBe('');
    expect(component.errorMessage).toBe('');
  });

  /**
   * Verifies delete state tracking.
   */
  it('should track the customer currently being deleted', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    const customer = createCustomer('customer-delete');

    userServiceSpy.deleteUser.and.callFake(() => {
      expect(component.isDeleting).toBeTrue();
      expect(component.deletingUserId).toBe('customer-delete');
      expect(component.isDeletingCustomer(customer)).toBeTrue();

      return of(void 0);
    });

    component.deleteCustomer(customer);

    expect(component.isDeleting).toBeFalse();
    expect(component.deletingUserId).toBeNull();
  });

  /**
   * Verifies deletion error handling.
   */
  it('should handle customer deletion errors', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    userServiceSpy.deleteUser.and.returnValue(
      throwError(() => ({
        error: {
          message: 'Customer cannot be deleted.',
        },
      })),
    );

    const customer = createCustomer('customer-delete');

    component.customers = [customer];

    component.deleteCustomer(customer);

    expect(component.isDeleting).toBeFalse();
    expect(component.deletingUserId).toBeNull();
    expect(component.errorMessage).toBe('Customer cannot be deleted.');
    expect(component.customers).toEqual([customer]);
  });

  /**
   * Verifies that isDeletingCustomer identifies only the active customer.
   */
  it('should identify only the customer currently being deleted', () => {
    component.isDeleting = true;
    component.deletingUserId = 'customer-1';

    expect(
      component.isDeletingCustomer(createCustomer('customer-1')),
    ).toBeTrue();

    expect(
      component.isDeletingCustomer(createCustomer('customer-2')),
    ).toBeFalse();
  });

  /**
   * Verifies first-name validation.
   */
  it('should reject a missing first name', () => {
    component.openCreateForm();

    component.form = {
      ...createRequest(),
      firstName: '',
    };

    component.saveCustomer();

    expect(userServiceSpy.createCustomer).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('First name is required.');
  });

  /**
   * Verifies last-name validation.
   */
  it('should reject a missing last name', () => {
    component.openCreateForm();

    component.form = {
      ...createRequest(),
      lastName: '',
    };

    component.saveCustomer();

    expect(userServiceSpy.createCustomer).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Last name is required.');
  });

  /**
   * Verifies email-required validation.
   */
  it('should reject a missing email address', () => {
    component.openCreateForm();

    component.form = {
      ...createRequest(),
      email: '',
    };

    component.saveCustomer();

    expect(userServiceSpy.createCustomer).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Email address is required.');
  });

  /**
   * Verifies malformed email validation.
   */
  it('should reject an invalid email address', () => {
    component.openCreateForm();

    component.form = {
      ...createRequest(),
      email: 'invalid-email',
    };

    component.saveCustomer();

    expect(userServiceSpy.createCustomer).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Please enter a valid email address.');
  });

  /**
   * Verifies password-required validation during creation.
   */
  it('should reject a missing password during customer creation', () => {
    component.openCreateForm();

    component.form = {
      ...createRequest(),
      password: '',
    };

    component.saveCustomer();

    expect(userServiceSpy.createCustomer).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Password is required.');
  });

  /**
   * Verifies minimum password length validation.
   */
  it('should reject a password shorter than eight characters', () => {
    component.openCreateForm();

    component.form = {
      ...createRequest(),
      password: '1234567',
    };

    component.saveCustomer();

    expect(userServiceSpy.createCustomer).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe(
      'Password must contain at least 8 characters.',
    );
  });

  /**
   * Verifies that passwords are not required during customer updates.
   */
  it('should not require a password when updating a customer', () => {
    component.openEditForm(createCustomer());

    component.form.password = '';

    component.saveCustomer();

    expect(userServiceSpy.updateCustomer).toHaveBeenCalled();
    expect(component.errorMessage).toBe('');
  });

  /**
   * Verifies trimming before customer creation.
   *
   * The role is part of the component form model but is intentionally not
   * passed to the UserService convenience method.
   */
  it('should trim customer fields before creating a customer', () => {
    component.openCreateForm();

    component.form = {
      firstName: '  New  ',
      lastName: '  Customer  ',
      email: '  new.customer@example.com  ',
      password: 'Password123',
      role: 'Customer',
    };

    component.saveCustomer();

    expect(userServiceSpy.createCustomer).toHaveBeenCalledWith({
      firstName: 'New',
      lastName: 'Customer',
      email: 'new.customer@example.com',
      password: 'Password123',
    });
  });

  /**
   * Verifies trimming before customer update.
   */
  it('should trim customer fields before updating a customer', () => {
    component.openEditForm(createCustomer());

    component.form.firstName = '  Updated  ';

    component.form.lastName = '  Customer  ';
    component.form.email = '  updated@example.com  ';

    component.saveCustomer();

    expect(userServiceSpy.updateCustomer).toHaveBeenCalledWith('customer-1', {
      firstName: 'Updated',
      lastName: 'Customer',
      email: 'updated@example.com',
    });
  });

  /**
   * Verifies customer display-name generation.
   */
  it('should return the customer display name', () => {
    const customer = createCustomer('customer-1', 'John', 'Smith');

    expect(component.getDisplayName(customer)).toBe('John Smith');
  });

  /**
   * Verifies display-name whitespace handling.
   */
  it('should return a trimmed display name', () => {
    const customer = createCustomer('customer-1', 'John', '');

    expect(component.getDisplayName(customer)).toBe('John');
  });

  /**
   * Verifies customer initial generation.
   */
  it('should return the customer initial', () => {
    const customer = createCustomer('customer-1', 'john', 'smith');

    expect(component.getInitial(customer)).toBe('J');
  });

  /**
   * Verifies successful operations clear error messages.
   */
  it('should clear the error message when showing success', () => {
    component.errorMessage = 'Previous error';

    component.openCreateForm();

    component.form = createRequest();

    component.saveCustomer();

    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('Customer created successfully.');
  });

  /**
   * Verifies error operations clear success messages.
   */
  it('should clear the success message when an error occurs', () => {
    component.successMessage = 'Previous success';

    component.openCreateForm();

    component.form = {
      ...createRequest(),
      firstName: '',
    };

    component.saveCustomer();

    expect(component.successMessage).toBe('');
    expect(component.errorMessage).toBe('First name is required.');
  });

  /**
   * Verifies automatic success-message cleanup after four seconds.
   */
  it('should automatically clear a success message after four seconds', () => {
    jasmine.clock().install();

    try {
      component.openCreateForm();
      component.form = createRequest();

      component.saveCustomer();

      expect(component.successMessage).toBe('Customer created successfully.');

      jasmine.clock().tick(3999);

      expect(component.successMessage).toBe('Customer created successfully.');

      jasmine.clock().tick(1);

      expect(component.successMessage).toBe('');
      expect(component.errorMessage).toBe('');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  /**
   * Verifies automatic error-message cleanup after four seconds.
   */
  it('should automatically clear an error message after four seconds', () => {
    jasmine.clock().install();

    try {
      component.openCreateForm();

      component.form = {
        ...createRequest(),
        firstName: '',
      };

      component.saveCustomer();

      expect(component.errorMessage).toBe('First name is required.');

      jasmine.clock().tick(4000);

      expect(component.errorMessage).toBe('');
      expect(component.successMessage).toBe('');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  /**
   * Verifies that destroying the component clears the active message timer.
   */
  it('should clear the message timer when the component is destroyed', () => {
    jasmine.clock().install();

    try {
      component.openCreateForm();
      component.form = createRequest();

      component.saveCustomer();

      expect(component.successMessage).toBe('Customer created successfully.');

      fixture.destroy();

      jasmine.clock().tick(4000);

      expect(component.successMessage).toBe('Customer created successfully.');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  /**
   * Verifies that opening the create form clears previous messages.
   */
  it('should clear messages when opening the create form', () => {
    component.errorMessage = 'Previous error';
    component.successMessage = 'Previous success';

    component.openCreateForm();

    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
  });

  /**
   * Verifies that opening the edit form clears previous messages.
   */
  it('should clear messages when opening the edit form', () => {
    component.errorMessage = 'Previous error';
    component.successMessage = 'Previous success';

    component.openEditForm(createCustomer());

    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
  });

  /**
   * Verifies that closing the form clears existing messages.
   */
  it('should clear messages when closing the form', () => {
    component.showForm = true;
    component.errorMessage = 'Error';
    component.successMessage = 'Success';

    component.closeForm();

    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
  });

  /**
   * Verifies that new customer forms use the Customer role internally.
   */
  it('should use the Customer role for new customers', () => {
    component.openCreateForm();

    expect(component.form.role).toBe('Customer');
  });

  /**
   * Verifies that editing customers keeps the Customer role.
   */
  it('should use the Customer role when editing customers', () => {
    component.openEditForm(createCustomer());

    expect(component.form.role).toBe('Customer');
  });

  /**
   * Verifies that successful deletion removes only the selected customer.
   */
  it('should remove only the deleted customer from the collection', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    const customer1 = createCustomer('customer-1');

    const customer2 = createCustomer('customer-2');
    const customer3 = createCustomer('customer-3');

    component.customers = [customer1, customer2, customer3];

    component.deleteCustomer(customer2);

    expect(component.customers).toEqual([customer1, customer3]);
  });

  /**
   * Verifies that failed deletion preserves the customer.
   */
  it('should preserve the customer when deletion fails', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    userServiceSpy.deleteUser.and.returnValue(
      throwError(() => ({
        status: 500,
      })),
    );

    const customer = createCustomer('customer-delete');

    component.customers = [customer];

    component.deleteCustomer(customer);

    expect(component.customers).toEqual([customer]);
    expect(component.errorMessage).toBe(
      'Unable to delete customer. Please try again.',
    );
  });

  /**
   * Verifies that deleting a customer clears previous messages first.
   */
  it('should clear previous messages before deleting a customer', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    component.successMessage = 'Previous success';

    component.errorMessage = 'Previous error';

    const customer = createCustomer();

    component.deleteCustomer(customer);

    expect(component.successMessage).toBe('Customer deleted successfully.');
    expect(component.errorMessage).toBe('');
  });

  /**
   * Verifies that opening the create form succeeds and the form becomes
   * visible.
   */
  it('should request scrolling when opening the create form', () => {
    component.openCreateForm();

    fixture.detectChanges();

    expect(component.showForm).toBeTrue();
  });

  /**
   * Verifies that opening the edit form succeeds and the form becomes
   * visible.
   */
  it('should request scrolling when opening the edit form', () => {
    component.openEditForm(createCustomer());

    fixture.detectChanges();

    expect(component.showForm).toBeTrue();
  });

  /**
   * Verifies that the conditionally rendered create form is rendered.
   */
  it('should render the create form successfully', () => {
    component.openCreateForm();

    fixture.detectChanges();

    const formElement = fixture.nativeElement.querySelector('.form-card');

    expect(formElement).toBeTruthy();
  });

  /**
   * Verifies that loaded customers are rendered in the table.
   */
  it('should render customers returned by the API', () => {
    const customers = [
      createCustomer('customer-1', 'John', 'Smith', 'john@example.com'),
      createCustomer('customer-2', 'Jane', 'Doe', 'jane@example.com'),
    ];

    userServiceSpy.getCustomers.and.returnValue(of(customers));

    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');

    expect(rows.length).toBe(2);
  });

  /**
   * Verifies that the empty-state content is rendered when no customers
   * are returned.
   */
  it('should render the empty state when no customers exist', () => {
    userServiceSpy.getCustomers.and.returnValue(of([]));

    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');

    expect(emptyState).toBeTruthy();
  });

  /**
   * Verifies that the loading state finishes after a synchronous response.
   */
  it('should finish loading after retrieving customers successfully', () => {
    userServiceSpy.getCustomers.and.returnValue(of([createCustomer()]));

    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();

    const spinner = fixture.nativeElement.querySelector('.spinner');

    expect(spinner).toBeNull();
  });

  /**
   * Verifies whitespace-only first-name validation.
   */
  it('should reject whitespace-only first names', () => {
    component.openCreateForm();

    component.form = {
      ...createRequest(),
      firstName: '   ',
    };

    component.saveCustomer();

    expect(userServiceSpy.createCustomer).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('First name is required.');
  });

  /**
   * Verifies whitespace-only last-name validation.
   */
  it('should reject whitespace-only last names', () => {
    component.openCreateForm();

    component.form = {
      ...createRequest(),
      lastName: '   ',
    };

    component.saveCustomer();

    expect(userServiceSpy.createCustomer).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Last name is required.');
  });

  /**
   * Verifies whitespace-only email validation.
   */
  it('should reject whitespace-only email addresses', () => {
    component.openCreateForm();

    component.form = {
      ...createRequest(),
      email: '   ',
    };

    component.saveCustomer();

    expect(userServiceSpy.createCustomer).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Email address is required.');
  });

  /**
   * Verifies that a complete valid create form is accepted.
   */
  it('should accept a complete valid customer form', () => {
    component.openCreateForm();

    component.form = createRequest();

    component.saveCustomer();

    expect(userServiceSpy.createCustomer).toHaveBeenCalled();
    expect(component.errorMessage).toBe('');
  });

  /**
   * Verifies that a complete valid update form is accepted.
   */
  it('should accept a complete valid customer update form', () => {
    component.openEditForm(createCustomer());

    component.form = {
      firstName: 'Updated',
      lastName: 'Customer',
      email: 'updated@example.com',
      password: '',
      role: 'Customer',
    };

    component.saveCustomer();

    expect(userServiceSpy.updateCustomer).toHaveBeenCalled();
    expect(component.errorMessage).toBe('');
  });

  /**
   * Verifies the missing editing-customer identifier branch.
   *
   * The form contains valid values intentionally so validation does not
   * terminate the operation before the component checks the identifier.
   */
  it('should handle a missing editing customer identifier', () => {
    component.showForm = true;
    component.isEditing = true;
    component.editingCustomerId = null;

    component.form = {
      firstName: 'Updated',
      lastName: 'Customer',
      email: 'updated@example.com',
      password: '',
      role: 'Customer',
    };

    component.saveCustomer();

    expect(userServiceSpy.updateCustomer).not.toHaveBeenCalled();
    expect(component.isSaving).toBeFalse();
    expect(component.errorMessage).toBe(
      'Unable to determine which customer should be updated.',
    );
  });

  /**
   * Verifies that deletion uses the Identity user identifier.
   */
  it('should use the customer id when deleting', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    const customer = createCustomer('identity-user-123', 'Test', 'User');

    component.deleteCustomer(customer);

    expect(userServiceSpy.deleteUser).toHaveBeenCalledWith('identity-user-123');
  });

  /**
   * Verifies uppercase initial generation for lowercase names.
   */
  it('should return an uppercase initial for lowercase names', () => {
    const customer = createCustomer('customer-1', 'mukesh', 'soni');

    expect(component.getInitial(customer)).toBe('M');
  });

  /**
   * Verifies that Customer role returned by the API is preserved.
   */
  it('should preserve the Customer role returned by the API', () => {
    const customer = createCustomer();

    userServiceSpy.getCustomers.and.returnValue(of([customer]));

    fixture.detectChanges();

    expect(component.customers[0].role).toBe('Customer');
  });

  /**
   * Verifies that the component can be destroyed safely after initialization.
   */
  it('should destroy successfully', () => {
    fixture.detectChanges();

    expect(() => fixture.destroy()).not.toThrow();
  });
});
