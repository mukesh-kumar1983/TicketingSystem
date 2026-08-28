using TicketingSystem.Application.DTOs.Users;

namespace TicketingSystem.Application.Interfaces;

/// <summary>
/// Provides application-level operations for managing customers
/// and support agents.
/// </summary>
public interface IUserService
{
    /// <summary>
    /// Retrieves users belonging to the specified application role.
    /// </summary>
    /// <param name="role">
    /// The application role to filter by.
    /// </param>
    /// <returns>
    /// A collection of users belonging to the specified role.
    /// </returns>
    Task<IReadOnlyList<UserResponse>> GetUsersAsync(
        string role);

    /// <summary>
    /// Retrieves a single user by identifier.
    /// </summary>
    /// <param name="userId">
    /// The ASP.NET Core Identity user identifier.
    /// </param>
    /// <returns>
    /// The requested user when found; otherwise <see langword="null"/>.
    /// </returns>
    Task<UserResponse?> GetUserAsync(
        string userId);

    /// <summary>
    /// Creates a new customer or support agent.
    /// </summary>
    /// <param name="request">
    /// Information required to create the user.
    /// </param>
    /// <returns>
    /// The newly created user.
    /// </returns>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the user cannot be created.
    /// </exception>
    Task<UserResponse> CreateUserAsync(
        CreateUserRequest request);

    /// <summary>
    /// Updates an existing customer or support agent.
    /// </summary>
    /// <param name="userId">
    /// The identifier of the user to update.
    /// </param>
    /// <param name="request">
    /// The updated user information.
    /// </param>
    /// <returns>
    /// The updated user.
    /// </returns>
    /// <exception cref="KeyNotFoundException">
    /// Thrown when the requested user does not exist.
    /// </exception>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the user cannot be updated.
    /// </exception>
    Task<UserResponse> UpdateUserAsync(
        string userId,
        UpdateUserRequest request);

    /// <summary>
    /// Deletes an existing customer or support agent.
    /// </summary>
    /// <param name="userId">
    /// The identifier of the user to delete.
    /// </param>
    /// <exception cref="KeyNotFoundException">
    /// Thrown when the requested user does not exist.
    /// </exception>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the user cannot be deleted.
    /// </exception>
    Task DeleteUserAsync(
        string userId);
}