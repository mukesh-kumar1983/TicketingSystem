namespace TicketingSystem.Application.Interfaces;

/// <summary>
/// Provides application-level operations for user authentication,
/// profile management, and authorization.
/// </summary>
public interface IIdentityService
{
    /// <summary>
    /// Attempts to authenticate a user using the supplied credentials.
    /// </summary>
    /// <param name="email">The user's email address.</param>
    /// <param name="password">The user's password.</param>
    /// <returns>
    /// The authenticated user's information when authentication succeeds;
    /// otherwise, <see langword="null"/>.
    /// </returns>
    Task<AuthenticatedUser?> AuthenticateAsync(
        string email,
        string password);

    /// <summary>
    /// Updates the profile information of an existing user.
    /// </summary>
    /// <param name="userId">
    /// The identifier of the user whose profile should be updated.
    /// </param>
    /// <param name="firstName">
    /// The user's new first name.
    /// </param>
    /// <param name="lastName">
    /// The user's new last name.
    /// </param>
    /// <param name="email">
    /// The user's new email address.
    /// </param>
    /// <returns>
    /// The updated user's information when the operation succeeds;
    /// otherwise, <see langword="null"/>.
    /// </returns>
    Task<AuthenticatedUser?> UpdateUserAsync(
        string userId,
        string firstName,
        string lastName,
        string email);
}

/// <summary>
/// Represents the basic information about an authenticated application user.
/// </summary>
public sealed class AuthenticatedUser
{
    /// <summary>
    /// Gets or initializes the user's identifier.
    /// </summary>
    public string UserId { get; init; } = string.Empty;

    /// <summary>
    /// Gets or initializes the user's email address.
    /// </summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// Gets or initializes the user's first name.
    /// </summary>
    public string FirstName { get; init; } = string.Empty;

    /// <summary>
    /// Gets or initializes the user's last name.
    /// </summary>
    public string LastName { get; init; } = string.Empty;

    /// <summary>
    /// Gets or initializes the user's application role.
    /// </summary>
    public string Role { get; init; } = string.Empty;
}