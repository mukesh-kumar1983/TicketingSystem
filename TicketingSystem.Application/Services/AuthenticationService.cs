using TicketingSystem.Application.DTOs.Authentication;
using TicketingSystem.Application.Interfaces;

namespace TicketingSystem.Application.Services;

/// <summary>
/// Provides authentication-related application operations.
/// </summary>
public sealed class AuthenticationService
{
    private readonly IIdentityService _identityService;
    private readonly IJwtTokenService _jwtTokenService;

    /// <summary>
    /// Initializes a new instance of the <see cref="AuthenticationService"/> class.
    /// </summary>
    /// <param name="identityService">
    /// The identity service.
    /// </param>
    /// <param name="jwtTokenService">
    /// The JWT token service.
    /// </param>
    public AuthenticationService(
        IIdentityService identityService,
        IJwtTokenService jwtTokenService)
    {
        _identityService = identityService;
        _jwtTokenService = jwtTokenService;
    }

    /// <summary>
    /// Authenticates a user and generates a JWT access token.
    /// </summary>
    /// <param name="request">
    /// The login credentials.
    /// </param>
    /// <returns>
    /// The authentication response.
    /// </returns>
    /// <exception cref="UnauthorizedAccessException">
    /// Thrown when the supplied credentials are invalid.
    /// </exception>
    public async Task<LoginResponse> LoginAsync(
        LoginRequest request)
    {
        var user = await _identityService.AuthenticateAsync(
            request.Email,
            request.Password);

        if (user is null)
        {
            throw new UnauthorizedAccessException(
                "Invalid email address or password.");
        }

        return _jwtTokenService.GenerateToken(
            user.UserId,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role);
    }

    /// <summary>
    /// Updates the profile information of the currently authenticated user.
    /// </summary>
    /// <param name="userId">
    /// The identifier of the authenticated user.
    /// </param>
    /// <param name="request">
    /// The new profile information.
    /// </param>
    /// <returns>
    /// The updated authenticated user's information.
    /// </returns>
    /// <exception cref="UnauthorizedAccessException">
    /// Thrown when the authenticated user cannot be found.
    /// </exception>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the profile cannot be updated.
    /// </exception>
    public async Task<AuthenticatedUser> UpdateCurrentUserAsync(
        string userId,
        UpdateCurrentUserRequest request)
    {
        var user = await _identityService.UpdateUserAsync(
            userId,
            request.FirstName,
            request.LastName,
            request.Email);

        if (user is null)
        {
            throw new UnauthorizedAccessException(
                "The authenticated user could not be found.");
        }

        return user;
    }
}