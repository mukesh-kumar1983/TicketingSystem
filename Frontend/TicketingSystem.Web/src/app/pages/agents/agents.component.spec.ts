import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { AgentsComponent } from './agents.component';
import { UserService } from '../../core/services/user.service';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
} from '../../models/user.models';

/**

* ============================================================================
* TicketingSystem - Agents Component Unit Tests
* ============================================================================
*
* Tests the Support Agents administration page.
*
* Coverage includes:
*
* * Component creation.
* * Initial agent loading.
* * Agent loading errors.
* * Create-form opening and resetting.
* * Edit-form population.
* * Form closing.
* * Form validation.
* * Agent creation.
* * Agent update.
* * Agent deletion.
* * Delete cancellation.
* * Per-agent delete state.
* * Display-name and initial helpers.
* * Refresh behavior.
* * API error handling.
* * Create/edit form rendering.
*
* The tests use a mocked UserService so no real HTTP requests are made.
* ============================================================================
  */

describe('AgentsComponent', () => {
  let component: AgentsComponent;
  let fixture: ComponentFixture<AgentsComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  /**
  
  * Creates representative Support Agent test data.
    */
  const agentOne: UserResponse = {
    id: 'agent-001',
    firstName: 'John',
    lastName: 'Smith',
    email: '[john.smith@example.com](mailto:john.smith@example.com)',
    role: 'SupportAgent',
  };

  /**
  
  * Creates a second representative Support Agent.
    */
  const agentTwo: UserResponse = {
    id: 'agent-002',
    firstName: 'Jane',
    lastName: 'Doe',
    email: '[jane.doe@example.com](mailto:jane.doe@example.com)',
    role: 'SupportAgent',
  };

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj<UserService>('UserService', [
      'getAgents',
      'createAgent',
      'updateAgent',
      'deleteUser',
    ]);

    userServiceSpy.getAgents.and.returnValue(of([agentOne, agentTwo]));

    await TestBed.configureTestingModule({
      imports: [AgentsComponent],
      providers: [
        {
          provide: UserService,
          useValue: userServiceSpy,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AgentsComponent);
    component = fixture.componentInstance;
  });

  /**
  
  * Verifies that the component can be created successfully.
    */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
  
  * Verifies that agents are loaded during initialization.
    */
  it('should load agents on initialization', () => {
    fixture.detectChanges();

    expect(userServiceSpy.getAgents).toHaveBeenCalledTimes(1);

    expect(component.agents.length).toBe(2);
    expect(component.agents[0]).toEqual(agentOne);
    expect(component.agents[1]).toEqual(agentTwo);
    expect(component.isLoading).toBeFalse();
  });

  /**
  
  * Verifies that an empty API result produces an empty agent collection.
    */
  it('should handle an empty agent collection', () => {
    userServiceSpy.getAgents.and.returnValue(of([]));

    fixture.detectChanges();

    expect(component.agents).toEqual([]);
    expect(component.isLoading).toBeFalse();
  });

  /**
  
  * Verifies that loading failures are converted into a user-friendly
  * page-level error.
    */
  it('should handle an agent loading error', () => {
    userServiceSpy.getAgents.and.returnValue(
      throwError(() => ({
        status: 500,
        error: {
          message: 'Agent service is temporarily unavailable.',
        },
      })),
    );

    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe(
      'Agent service is temporarily unavailable.',
    );
    expect(component.successMessage).toBe('');
  });

  /**
  
  * Verifies that a generic loading failure uses the configured fallback.
    */
  it('should use the fallback message when loading fails without a useful error message', () => {
    userServiceSpy.getAgents.and.returnValue(
      throwError(() => ({
        status: 500,
      })),
    );

    fixture.detectChanges();

    expect(component.errorMessage).toBe(
      'Unable to load support agents. Please try again.',
    );
  });

  /**
  
  * Verifies that openCreateForm resets the form and opens the form UI.
    */
  it('should open the create form', () => {
    component.form = {
      firstName: 'Existing',
      lastName: 'Value',
      email: '[existing@example.com](mailto:existing@example.com)',
      password: 'Password123',
      role: 'SupportAgent',
    };

    component.isEditing = true;

    component.editingAgentId = agentOne.id;

    component.openCreateForm();

    expect(component.showForm).toBeTrue();
    expect(component.isEditing).toBeFalse();
    expect(component.editingAgentId).toBeNull();

    expect(component.form).toEqual({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'SupportAgent',
    });
  });

  /**
  
  * Verifies that openEditForm populates the form with the selected agent.
    */
  it('should open the edit form with the selected agent data', () => {
    component.openEditForm(agentOne);

    expect(component.showForm).toBeTrue();

    expect(component.isEditing).toBeTrue();
    expect(component.editingAgentId).toBe(agentOne.id);

    expect(component.form).toEqual({
      firstName: agentOne.firstName,
      lastName: agentOne.lastName,
      email: agentOne.email,
      password: '',
      role: 'SupportAgent',
    });
  });

  /**
  
  * Verifies that closing the form resets its state.
    */
  it('should close and reset the form', () => {
    component.openEditForm(agentOne);

    component.closeForm();

    expect(component.showForm).toBeFalse();
    expect(component.isEditing).toBeFalse();
    expect(component.editingAgentId).toBeNull();

    expect(component.form).toEqual({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'SupportAgent',
    });
  });

  /**
  
  * Verifies that the form cannot be closed while saving.
    */
  it('should not close the form while saving', () => {
    component.openCreateForm();
    component.isSaving = true;

    component.closeForm();

    expect(component.showForm).toBeTrue();
  });

  /**
  
  * Verifies first-name validation.
    */
  it('should reject an empty first name', () => {
    component.openCreateForm();

    component.form.lastName = 'Smith';

    component.form.email = 'john.smith@example.com';
    component.form.password = 'Password123';

    component.saveAgent();

    expect(component.errorMessage).toBe('First name is required.');
    expect(userServiceSpy.createAgent).not.toHaveBeenCalled();
  });

  /**
  
  * Verifies last-name validation.
    */
  it('should reject an empty last name', () => {
    component.openCreateForm();

    component.form.firstName = 'John';

    component.form.email = 'john.smith@example.com';
    component.form.password = 'Password123';

    component.saveAgent();

    expect(component.errorMessage).toBe('Last name is required.');
    expect(userServiceSpy.createAgent).not.toHaveBeenCalled();
  });

  /**
  
  * Verifies email-required validation.
    */
  it('should reject an empty email address', () => {
    component.openCreateForm();

    component.form.firstName = 'John';

    component.form.lastName = 'Smith';
    component.form.password = 'Password123';

    component.saveAgent();

    expect(component.errorMessage).toBe('Email address is required.');
    expect(userServiceSpy.createAgent).not.toHaveBeenCalled();
  });

  /**
  
  * Verifies email-format validation.
    */
  it('should reject an invalid email address', () => {
    component.openCreateForm();

    component.form.firstName = 'John';

    component.form.lastName = 'Smith';
    component.form.email = 'invalid-email';
    component.form.password = 'Password123';

    component.saveAgent();

    expect(component.errorMessage).toBe('Please enter a valid email address.');
    expect(userServiceSpy.createAgent).not.toHaveBeenCalled();
  });

  /**
  
  * Verifies password-required validation for new agents.
    */
  it('should require a password when creating an agent', () => {
    component.openCreateForm();

    component.form.firstName = 'John';

    component.form.lastName = 'Smith';
    component.form.email = 'john.smith@example.com';

    component.saveAgent();

    expect(component.errorMessage).toBe('Password is required.');
    expect(userServiceSpy.createAgent).not.toHaveBeenCalled();
  });

  /**
  
  * Verifies minimum password length validation.
    */
  it('should reject a password shorter than eight characters', () => {
    component.openCreateForm();

    component.form.firstName = 'John';

    component.form.lastName = 'Smith';
    component.form.email = 'john.smith@example.com';
    component.form.password = '1234567';

    component.saveAgent();

    expect(component.errorMessage).toBe(
      'Password must contain at least 8 characters.',
    );
    expect(userServiceSpy.createAgent).not.toHaveBeenCalled();
  });

  /**
  
  * Verifies that password validation is not applied while editing.
    */
  it('should not require a password when editing an agent', () => {
    component.openEditForm(agentOne);

    component.form.firstName = 'Updated';

    component.form.lastName = 'Smith';
    component.form.email = 'updated@example.com';
    component.form.password = '';

    userServiceSpy.updateAgent.and.returnValue(of(agentOne));

    component.saveAgent();

    expect(userServiceSpy.updateAgent).toHaveBeenCalledTimes(1);
  });

  /**
  
  * Verifies successful agent creation.
    */
  it('should create an agent successfully', () => {
    component.openCreateForm();

    component.form.firstName = ' New ';

    component.form.lastName = ' Agent ';
    component.form.email = ' new.agent@example.com ';
    component.form.password = 'Password123';

    userServiceSpy.createAgent.and.returnValue(of(agentOne));

    component.saveAgent();

    expect(userServiceSpy.createAgent).toHaveBeenCalledWith({
      firstName: 'New',
      lastName: 'Agent',
      email: 'new.agent@example.com',
      password: 'Password123',
      role: 'SupportAgent',
    } as CreateUserRequest);

    expect(component.isSaving).toBeFalse();
    expect(component.showForm).toBeFalse();
    expect(component.successMessage).toBe(
      'Support agent created successfully.',
    );
  });

  /**
  
  * Verifies that the agent list is refreshed after successful creation.
    */
  it('should reload agents after successful creation', () => {
    component.openCreateForm();

    component.form.firstName = 'New';

    component.form.lastName = 'Agent';
    component.form.email = 'new.agent@example.com';
    component.form.password = 'Password123';

    userServiceSpy.createAgent.and.returnValue(of(agentOne));

    component.saveAgent();

    expect(userServiceSpy.getAgents).toHaveBeenCalled();
  });

  /**
  
  * Verifies create-agent API error handling.
    */
  it('should handle a create-agent API error', () => {
    component.openCreateForm();

    component.form.firstName = 'John';

    component.form.lastName = 'Smith';
    component.form.email = 'john.smith@example.com';
    component.form.password = 'Password123';

    userServiceSpy.createAgent.and.returnValue(
      throwError(() => ({
        status: 400,
        error: {
          message: 'Email address is already registered.',
        },
      })),
    );

    component.saveAgent();

    expect(component.isSaving).toBeFalse();
    expect(component.showForm).toBeTrue();
    expect(component.errorMessage).toBe('Email address is already registered.');
  });

  /**
  
  * Verifies successful agent update.
    */
  it('should update an agent successfully', () => {
    component.openEditForm(agentOne);

    component.form.firstName = 'John Updated';

    component.form.lastName = 'Smith Updated';
    component.form.email = 'john.updated@example.com';

    userServiceSpy.updateAgent.and.returnValue(of(agentTwo));

    component.saveAgent();

    expect(userServiceSpy.updateAgent).toHaveBeenCalledWith(agentOne.id, {
      firstName: 'John Updated',
      lastName: 'Smith Updated',
      email: 'john.updated@example.com',
      role: 'SupportAgent',
    } as UpdateUserRequest);

    expect(component.isSaving).toBeFalse();
    expect(component.showForm).toBeFalse();
    expect(component.successMessage).toBe(
      'Support agent updated successfully.',
    );
  });

  /**
  
  * Verifies that an update API error is displayed inside the form.
    */
  it('should handle an update-agent API error', () => {
    component.openEditForm(agentOne);

    userServiceSpy.updateAgent.and.returnValue(
      throwError(() => ({
        status: 400,
        error: {
          title: 'Unable to update support agent.',
        },
      })),
    );

    component.saveAgent();

    expect(component.isSaving).toBeFalse();
    expect(component.showForm).toBeTrue();
    expect(component.errorMessage).toBe('Unable to update support agent.');
  });

  /**
  
  * Verifies that an update cannot proceed without an editing identifier.
  *
  * The component is explicitly placed into edit mode without an identifier.
  * This ensures saveAgent() enters the update path and updateAgent()
  * handles the missing identifier safely.
    */
  it('should handle a missing editing agent identifier', () => {
    component.openCreateForm();

    component.isEditing = true;

    component.editingAgentId = null;

    component.form.firstName = 'John';
    component.form.lastName = 'Smith';
    component.form.email = 'john.smith@example.com';

    component.saveAgent();

    expect(component.isSaving).toBeFalse();
    expect(component.errorMessage).toBe(
      'Unable to determine which support agent should be updated.',
    );
    expect(userServiceSpy.createAgent).not.toHaveBeenCalled();
    expect(userServiceSpy.updateAgent).not.toHaveBeenCalled();
  });

  /**
  
  * Verifies delete cancellation.
    */
  it('should not delete an agent when confirmation is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.agents = [agentOne, agentTwo];

    component.deleteAgent(agentOne);

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete John Smith?',
    );
    expect(userServiceSpy.deleteUser).not.toHaveBeenCalled();
    expect(component.agents).toEqual([agentOne, agentTwo]);
  });

  /**
  
  * Verifies successful agent deletion.
    */
  it('should delete an agent successfully', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    userServiceSpy.deleteUser.and.returnValue(of(void 0));

    component.agents = [agentOne, agentTwo];

    component.deleteAgent(agentOne);

    expect(userServiceSpy.deleteUser).toHaveBeenCalledWith(agentOne.id);
    expect(component.agents).toEqual([agentTwo]);
    expect(component.isDeleting).toBeFalse();
    expect(component.deletingUserId).toBeNull();
    expect(component.successMessage).toBe(
      'Support agent deleted successfully.',
    );
  });

  /**
  
  * Verifies delete-agent API error handling.
    */
  it('should handle a delete-agent API error', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    userServiceSpy.deleteUser.and.returnValue(
      throwError(() => ({
        status: 500,
        error: {
          message: 'Customer cannot be deleted.',
        },
      })),
    );

    component.agents = [agentOne, agentTwo];

    component.deleteAgent(agentOne);

    expect(component.agents).toEqual([agentOne, agentTwo]);
    expect(component.isDeleting).toBeFalse();
    expect(component.deletingUserId).toBeNull();
    expect(component.errorMessage).toBe('Customer cannot be deleted.');
  });

  /**
  
  * Verifies that the currently deleted agent can be identified.
    */
  it('should identify the agent currently being deleted', () => {
    component.isDeleting = true;
    component.deletingUserId = agentOne.id;

    expect(component.isDeletingAgent(agentOne)).toBeTrue();

    expect(component.isDeletingAgent(agentTwo)).toBeFalse();
  });

  /**
  
  * Verifies that no agent is reported as deleting when deletion is inactive.
    */
  it('should return false when no delete operation is active', () => {
    component.isDeleting = false;
    component.deletingUserId = null;

    expect(component.isDeletingAgent(agentOne)).toBeFalse();
  });

  /**
  
  * Verifies display-name generation.
    */
  it('should return an agent display name', () => {
    expect(component.getDisplayName(agentOne)).toBe('John Smith');
  });

  /**
  
  * Verifies display-name trimming when one name is missing.
    */
  it('should trim an agent display name correctly', () => {
    const agent: UserResponse = {
      ...agentOne,
      firstName: 'John',
      lastName: '',
    };

    expect(component.getDisplayName(agent)).toBe('John');
  });

  /**
  
  * Verifies initial generation.
    */
  it('should return the first letter of the agent display name', () => {
    expect(component.getInitial(agentOne)).toBe('J');
    expect(component.getInitial(agentTwo)).toBe('J');
  });

  /**
  
  * Verifies that refresh delegates to loadAgents.
    */
  it('should refresh the agent list', () => {
    spyOn(component, 'loadAgents');

    component.refresh();

    expect(component.loadAgents).toHaveBeenCalledTimes(1);
  });

  /**
  
  * Verifies that the rendered table contains loaded agents.
    */
  it('should render loaded agents in the table', () => {
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));

    expect(rows.length).toBe(2);

    expect(rows[0].nativeElement.textContent).toContain('John');
    expect(rows[0].nativeElement.textContent).toContain(
      'john.smith@example.com',
    );

    expect(rows[1].nativeElement.textContent).toContain('Jane');
    expect(rows[1].nativeElement.textContent).toContain('jane.doe@example.com');
  });

  /**
  
  * Verifies that the empty state is rendered when no agents exist.
    */
  it('should render the empty state when there are no agents', () => {
    userServiceSpy.getAgents.and.returnValue(of([]));

    fixture.detectChanges();

    const emptyState = fixture.debugElement.query(By.css('.empty-state'));

    expect(emptyState).toBeTruthy();
    expect(emptyState.nativeElement.textContent).toContain(
      'No support agents yet',
    );
  });

  /**
  
  * Verifies that opening the create form renders the complete form card.
  *
  * The heading "Create Support Agent" belongs to the form-card header,
  * not the <form class="agent-form"> element itself. Therefore the test
  * intentionally queries the complete form-card container.
    */
  it('should render the create form when requested', () => {
    fixture.detectChanges();

    component.openCreateForm();

    fixture.detectChanges();

    const formCard = fixture.debugElement.query(By.css('.form-card'));

    expect(formCard).toBeTruthy();
    expect(formCard.nativeElement.textContent).toContain(
      'Create Support Agent',
    );

    const form = formCard.query(By.css('.agent-form'));

    expect(form).toBeTruthy();
  });

  /**
  
  * Verifies that opening the edit form renders the correct heading.
  *
  * The heading "Edit Support Agent" belongs to the form-card header,
  * not the <form class="agent-form"> element itself.
    */
  it('should render the edit form when editing an agent', () => {
    fixture.detectChanges();

    component.openEditForm(agentOne);

    fixture.detectChanges();

    const formCard = fixture.debugElement.query(By.css('.form-card'));

    expect(formCard).toBeTruthy();
    expect(formCard.nativeElement.textContent).toContain('Edit Support Agent');

    const form = formCard.query(By.css('.agent-form'));

    expect(form).toBeTruthy();
  });

  /**
  
  * Verifies that the form's password field is hidden during editing.
    */
  it('should hide the password field while editing', () => {
    fixture.detectChanges();

    component.openEditForm(agentOne);

    fixture.detectChanges();

    const passwordInput = fixture.debugElement.query(By.css('#agentPassword'));

    expect(passwordInput).toBeNull();
  });

  /**
  
  * Verifies that the password field is displayed while creating.
    */
  it('should display the password field while creating', () => {
    fixture.detectChanges();

    component.openCreateForm();

    fixture.detectChanges();

    const passwordInput = fixture.debugElement.query(By.css('#agentPassword'));

    expect(passwordInput).toBeTruthy();
  });

  /**
  
  * Verifies that delete controls are rendered for each agent.
    */
  it('should display delete controls for each agent', () => {
    fixture.detectChanges();

    const deleteButtons = fixture.debugElement.queryAll(
      By.css('.delete-button'),
    );

    expect(deleteButtons.length).toBe(2);
    expect(deleteButtons[0].nativeElement.textContent).toContain('Delete');
    expect(deleteButtons[1].nativeElement.textContent).toContain('Delete');
  });

  /**
  
  * Verifies cleanup of the component's message timer.
    */
  it('should clear the message timer when destroyed', () => {
    component['messageTimer'] = setTimeout(() => undefined, 10000);

    const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();

    fixture.destroy();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
