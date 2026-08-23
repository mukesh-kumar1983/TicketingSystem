namespace TicketingSystem.Application.DTOs.Authentication;

/// <summary>
/// Represents the authentication information returned after a successful login.
/// </summary>
public sealed class LoginResponse
{
    /// <summary>
    /// Gets or sets the JWT access token.
    /// </summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the authenticated user's identifier.
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the authenticated user's first name.
    /// </summary>
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the authenticated user's last name.
    /// </summary>
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// Gets the user's full name.
    /// </summary>
    public string FullName => $"{FirstName} {LastName}".Trim();

    /// <summary>
    /// Gets or sets the authenticated user's email address.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the authenticated user's role.
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the date and time when the access token expires.
    /// </summary>
    public DateTime ExpiresAt { get; set; }
}