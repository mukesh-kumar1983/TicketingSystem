namespace TicketingSystem.Application.DTOs.Users;

/// <summary>
/// Represents the information that can be changed for an existing
/// customer or support agent.
/// </summary>
public sealed class UpdateUserRequest
{
    /// <summary>
    /// Gets or sets the user's first name.
    /// </summary>
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the user's last name.
    /// </summary>
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the user's email address.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the user's application role.
    ///
    /// Supported values are:
    ///
    /// Customer
    /// SupportAgent
    /// </summary>
    public string Role { get; set; } = string.Empty;
}