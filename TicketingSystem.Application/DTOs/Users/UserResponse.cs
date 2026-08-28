namespace TicketingSystem.Application.DTOs.Users;

/// <summary>
/// Represents user information returned by the user-management API.
/// </summary>
public sealed class UserResponse
{
    /// <summary>
    /// Gets or sets the user's Identity identifier.
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// Gets or sets the user's first name.
    /// </summary>
    public string FirstName { get; init; } = string.Empty;

    /// <summary>
    /// Gets or sets the user's last name.
    /// </summary>
    public string LastName { get; init; } = string.Empty;

    /// <summary>
    /// Gets the user's full name.
    /// </summary>
    public string FullName =>
        $"{FirstName} {LastName}".Trim();

    /// <summary>
    /// Gets or sets the user's email address.
    /// </summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// Gets or sets the user's application role.
    /// </summary>
    public string Role { get; init; } = string.Empty;
}