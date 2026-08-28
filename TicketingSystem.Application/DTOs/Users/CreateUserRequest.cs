namespace TicketingSystem.Application.DTOs.Users;

/// <summary>
/// Represents the information required to create a customer
/// or support agent account.
/// </summary>
public sealed class CreateUserRequest
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
    /// Gets or sets the initial password for the account.
    /// </summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the application role assigned to the user.
    ///
    /// Supported values are:
    ///
    /// Customer
    /// SupportAgent
    /// </summary>
    public string Role { get; set; } = string.Empty;
}