using TicketingSystem.Application.DTOs.Authentication;

namespace TicketingSystem.Application.Interfaces;

/// <summary>
/// Defines operations for generating JWT access tokens.
/// </summary>
public interface IJwtTokenService
{
    /// <summary>
    /// Generates an access token for the specified authenticated user.
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="email">The user's email address.</param>
    /// <param name="firstName">The user's first name.</param>
    /// <param name="lastName">The user's last name.</param>
    /// <param name="role">The user's application role.</param>
    /// <returns>The generated authentication response.</returns>
    LoginResponse GenerateToken(
        string userId,
        string email,
        string firstName,
        string lastName,
        string role);
}