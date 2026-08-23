namespace TicketingSystem.Application.DTOs.Authentication;

/// <summary>
/// Represents the credentials submitted when a user attempts to authenticate.
/// </summary>
public sealed class LoginRequest
{
    /// <summary>
    /// Gets or sets the user's email address.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the user's password.
    /// </summary>
    public string Password { get; set; } = string.Empty;
}