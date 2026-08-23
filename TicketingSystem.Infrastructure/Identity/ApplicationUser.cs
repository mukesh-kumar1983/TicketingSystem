using Microsoft.AspNetCore.Identity;

namespace TicketingSystem.Infrastructure.Identity;

/// <summary>
/// Represents an application user stored by ASP.NET Core Identity.
/// </summary>
public sealed class ApplicationUser : IdentityUser
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
    /// Gets the user's full name.
    /// </summary>
    public string FullName => $"{FirstName} {LastName}".Trim();
}