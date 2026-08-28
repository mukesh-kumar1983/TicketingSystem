using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketingSystem.Application.DTOs.Authentication;
using TicketingSystem.Application.Interfaces;
using TicketingSystem.Application.Services;

namespace TicketingSystem.Api.Controllers;

/// <summary>
/// Provides authentication and authenticated-user profile endpoints.
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
    /// The application authentication service.
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
            var response =
                await _authenticationService.LoginAsync(request);

            return Ok(response);
        }
        catch (UnauthorizedAccessException)
        {
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
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<object> GetCurrentUser()
    {
        var userId =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var email =
            User.FindFirst(ClaimTypes.Email)?.Value;

        var firstName =
            User.FindFirst(ClaimTypes.GivenName)?.Value;

        var lastName =
            User.FindFirst(ClaimTypes.Surname)?.Value;

        var role =
            User.FindFirst(ClaimTypes.Role)?.Value;

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
    /// Updates the profile information of the currently authenticated user.
    /// </summary>
    /// <param name="request">
    /// The new profile information.
    /// </param>
    /// <returns>
    /// The updated authenticated user's information.
    /// </returns>
    /// <remarks>
    /// This endpoint updates the first name, last name, and email address
    /// of the user associated with the current JWT.
    ///
    /// Endpoint:
    ///
    /// PUT /api/Auth/me
    ///
    /// Authentication:
    ///
    /// Authorization: Bearer {JWT}
    /// </remarks>
    [Authorize]
    [HttpPut("me")]
    [ProducesResponseType(
        typeof(AuthenticatedUser),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthenticatedUser>> UpdateCurrentUser(
        UpdateCurrentUserRequest request)
    {
        /*
         * The user ID comes from the validated JWT rather than
         * from the request body.
         *
         * This prevents a user from attempting to modify another
         * user's account by submitting a different ID.
         */
        var userId =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        try
        {
            var updatedUser =
                await _authenticationService.UpdateCurrentUserAsync(
                    userId,
                    request);

            return Ok(updatedUser);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }

    /// <summary>
    /// Returns diagnostic information about the current authentication
    /// context.
    /// </summary>
    /// <remarks>
    /// This endpoint is intended for development and troubleshooting.
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