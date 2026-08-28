using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketingSystem.Application.DTOs.TimeEntries;
using TicketingSystem.Application.Interfaces;

namespace TicketingSystem.Api.Controllers;

/// <summary>
/// Provides HTTP API endpoints for ticket work entries.
/// </summary>
[ApiController]
[Route("api/tickets/{ticketId:long}/time-entries")]
[Authorize]
public sealed class TimeEntriesController : ControllerBase
{
    private readonly ITimeEntryService _timeEntryService;

    /// <summary>
    /// Initializes a new instance of the
    /// <see cref="TimeEntriesController"/> class.
    /// </summary>
    /// <param name="timeEntryService">
    /// The time-entry application service.
    /// </param>
    public TimeEntriesController(
        ITimeEntryService timeEntryService)
    {
        _timeEntryService = timeEntryService;
    }

    /// <summary>
    /// Retrieves all work entries for a ticket.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<TimeEntryResponse>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<TimeEntryResponse>>> GetByTicket(
        long ticketId)
    {
        var entries =
            await _timeEntryService.GetByTicketAsync(
                ticketId,
                GetUserId(),
                GetRole());

        return Ok(entries);
    }

    /// <summary>
    /// Records work performed against a ticket.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(
        typeof(TimeEntryResponse),
        StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TimeEntryResponse>> Create(
        long ticketId,
        [FromBody] CreateTimeEntryRequest request)
    {
        var response =
            await _timeEntryService.CreateAsync(
                ticketId,
                request,
                GetUserId(),
                GetRole());

        return StatusCode(
            StatusCodes.Status201Created,
            response);
    }

    /// <summary>
    /// Gets the authenticated user's identifier.
    /// </summary>
    private string GetUserId()
    {
        return User.FindFirstValue(
                   ClaimTypes.NameIdentifier)
               ?? throw new UnauthorizedAccessException(
                   "The authenticated user's identifier is missing.");
    }

    /// <summary>
    /// Gets the authenticated user's role.
    /// </summary>
    private string GetRole()
    {
        return User.FindFirstValue(
                   ClaimTypes.Role)
               ?? throw new UnauthorizedAccessException(
                   "The authenticated user's role is missing.");
    }
}