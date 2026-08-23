using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketingSystem.Application.DTOs.Authentication;
using TicketingSystem.Application.Services;

namespace TicketingSystem.Api.Controllers;

/// <summary>
/// Provides authentication-related API endpoints.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    private readonly AuthenticationService _authenticationService;

    /// <summary>
    /// Initializes a new instance of the <see cref="AuthController"/> class.
    /// </summary>
    /// <param name="authenticationService">
    /// The application authentication service responsible for authenticating
    /// users and generating JWT access tokens.
    /// </param>
    public AuthController(
        AuthenticationService authenticationService)
    {
        _authenticationService = authenticationService;
    }

    /// <summary>
    /// Authenticates a user and returns a JWT access token.
    /// </summary>
    /// <param name="request">
    /// The user's login credentials.
    /// </param>
    /// <returns>
    /// The authenticated user's information and JWT access token.
    /// </returns>
    [HttpPost("login")]
    [ProducesResponseType(
        typeof(LoginResponse),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login(
        LoginRequest request)
    {
        try
        {
            // Delegate authentication to the application service.
            var response =
                await _authenticationService.LoginAsync(request);

            return Ok(response);
        }
        catch (UnauthorizedAccessException)
        {
            // Do not expose authentication details when credentials are
            // invalid. Return a consistent unauthorized response instead.
            return Unauthorized(new
            {
                message = "Invalid email address or password."
            });
        }
    }

    /// <summary>
    /// Returns information about the currently authenticated user.
    /// </summary>
    /// <returns>
    /// The authenticated user's identity and role information.
    /// </returns>
    /// <remarks>
    /// This endpoint requires a valid JWT Bearer access token.
    ///
    /// The token must be supplied in the HTTP Authorization header:
    ///
    /// Authorization: Bearer {JWT}
    /// </remarks>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<object> GetCurrentUser()
    {
        // The NameIdentifier claim contains the authenticated user's
        // application/Identity user identifier.
        var userId =
            User.FindFirst(
                ClaimTypes.NameIdentifier)?.Value;

        // The Email claim contains the authenticated user's email address.
        var email =
            User.FindFirst(
                ClaimTypes.Email)?.Value;

        // The GivenName claim contains the user's first name.
        var firstName =
            User.FindFirst(
                ClaimTypes.GivenName)?.Value;

        // The Surname claim contains the user's last name.
        var lastName =
            User.FindFirst(
                ClaimTypes.Surname)?.Value;

        // The Role claim contains the user's application role.
        var role =
            User.FindFirst(
                ClaimTypes.Role)?.Value;

        return Ok(new
        {
            userId,
            firstName,
            lastName,
            fullName = $"{firstName} {lastName}".Trim(),
            email,
            role
        });
    }

    /// <summary>
    /// Returns diagnostic information about the current authentication
    /// context.
    /// </summary>
    /// <remarks>
    /// This endpoint is intended for development and troubleshooting.
    ///
    /// It allows us to determine whether ASP.NET Core received and successfully
    /// validated the JWT Bearer token.
    ///
    /// This endpoint intentionally does not have [Authorize], because it is
    /// useful for diagnosing both authenticated and unauthenticated requests.
    /// </remarks>
    /// <returns>
    /// Authentication state and claims associated with the current request.
    /// </returns>
    [HttpGet("auth-debug")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult AuthenticationDebug()
    {
        return Ok(new
        {
            IsAuthenticated =
                User.Identity?.IsAuthenticated,

            AuthenticationType =
                User.Identity?.AuthenticationType,

            UserName =
                User.Identity?.Name,

            Claims =
                User.Claims
                    .Select(claim => new
                    {
                        claim.Type,
                        claim.Value
                    })
                    .ToList()
        });
    }
}