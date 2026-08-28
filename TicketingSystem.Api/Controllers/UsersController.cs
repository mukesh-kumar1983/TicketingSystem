using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketingSystem.Application.DTOs.Users;
using TicketingSystem.Application.Interfaces;

namespace TicketingSystem.Api.Controllers;

/// <summary>
/// Provides administrative endpoints for managing Customer and SupportAgent
/// accounts.
///
/// Only authenticated users with the Admin role are allowed to use these
/// endpoints.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public sealed class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    /// <summary>
    /// Initializes a new instance of the <see cref="UsersController"/> class.
    /// </summary>
    /// <param name="userService">
    /// Application service responsible for user management.
    /// </param>
    public UsersController(
        IUserService userService)
    {
        _userService = userService;
    }

    // =========================================================================
    // CUSTOMER ENDPOINTS
    // =========================================================================

    /// <summary>
    /// Retrieves all Customer accounts.
    /// </summary>
    /// <returns>
    /// A collection containing all customer accounts.
    /// </returns>
    [HttpGet("customers")]
    [ProducesResponseType(
        typeof(IReadOnlyList<UserResponse>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<UserResponse>>>
        GetCustomers()
    {
        var users =
            await _userService.GetUsersAsync("Customer");

        return Ok(users);
    }

    /// <summary>
    /// Retrieves all SupportAgent accounts.
    /// </summary>
    /// <returns>
    /// A collection containing all support agent accounts.
    /// </returns>
    [HttpGet("agents")]
    [ProducesResponseType(
        typeof(IReadOnlyList<UserResponse>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<UserResponse>>>
        GetAgents()
    {
        var users =
            await _userService.GetUsersAsync("SupportAgent");

        return Ok(users);
    }

    // =========================================================================
    // SINGLE USER
    // =========================================================================

    /// <summary>
    /// Retrieves a single Customer or SupportAgent by identifier.
    /// </summary>
    /// <param name="id">
    /// The ASP.NET Core Identity user identifier.
    /// </param>
    /// <returns>
    /// The requested user when found.
    /// </returns>
    [HttpGet("{id}")]
    [ProducesResponseType(
        typeof(UserResponse),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<UserResponse>>
        GetUser(string id)
    {
        var user =
            await _userService.GetUserAsync(id);

        if (user is null)
        {
            return NotFound(new
            {
                message = "User was not found."
            });
        }

        return Ok(user);
    }

    // =========================================================================
    // CREATE
    // =========================================================================

    /// <summary>
    /// Creates a new Customer or SupportAgent account.
    /// </summary>
    /// <param name="request">
    /// Information required to create the user.
    /// </param>
    /// <returns>
    /// The newly created user.
    /// </returns>
    [HttpPost]
    [ProducesResponseType(
        typeof(UserResponse),
        StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<UserResponse>>
        CreateUser(CreateUserRequest request)
    {
        try
        {
            var user =
                await _userService.CreateUserAsync(request);

            return CreatedAtAction(
                nameof(GetUser),
                new
                {
                    id = user.Id
                },
                user);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }

    // =========================================================================
    // UPDATE
    // =========================================================================

    /// <summary>
    /// Updates an existing Customer or SupportAgent account.
    /// </summary>
    /// <param name="id">
    /// The identifier of the user to update.
    /// </param>
    /// <param name="request">
    /// The updated user information.
    /// </param>
    /// <returns>
    /// The updated user.
    /// </returns>
    [HttpPut("{id}")]
    [ProducesResponseType(
        typeof(UserResponse),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<UserResponse>>
        UpdateUser(
            string id,
            UpdateUserRequest request)
    {
        try
        {
            var user =
                await _userService.UpdateUserAsync(
                    id,
                    request);

            return Ok(user);
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new
            {
                message = exception.Message
            });
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }

    // =========================================================================
    // DELETE
    // =========================================================================

    /// <summary>
    /// Deletes an existing Customer or SupportAgent account.
    /// </summary>
    /// <param name="id">
    /// The identifier of the user to delete.
    /// </param>
    /// <returns>
    /// No content when the user is successfully deleted.
    /// </returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult>
        DeleteUser(string id)
    {
        try
        {
            await _userService.DeleteUserAsync(id);

            return NoContent();
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new
            {
                message = exception.Message
            });
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }
}