using System.ComponentModel.DataAnnotations;

namespace TicketingSystem.Application.DTOs.Authentication;

/// <summary>
/// Represents the information that an authenticated user can update
/// on their own profile.
/// </summary>
public sealed class UpdateCurrentUserRequest
{
    /// <summary>
    /// Gets or sets the user's first name.
    /// </summary>
    [Required]
    [StringLength(
        100,
        MinimumLength = 1,
        ErrorMessage = "First name must be between 1 and 100 characters.")]
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the user's last name.
    /// </summary>
    [Required]
    [StringLength(
        100,
        MinimumLength = 1,
        ErrorMessage = "Last name must be between 1 and 100 characters.")]
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the user's email address.
    /// </summary>
    [Required]
    [EmailAddress]
    [StringLength(
        256,
        ErrorMessage = "Email address cannot exceed 256 characters.")]
    public string Email { get; set; } = string.Empty;
}