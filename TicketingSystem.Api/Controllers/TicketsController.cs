using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketingSystem.Application.DTOs.Tickets;
using TicketingSystem.Application.Interfaces;

namespace TicketingSystem.Api.Controllers;

/// <summary>
/// Provides HTTP API endpoints for managing support tickets.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    /// <summary>
    /// Initializes a new instance of the <see cref="TicketsController"/> class.
    /// </summary>
    /// <param name="ticketService">The ticket application service.</param>
    public TicketsController(
        ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    /// <summary>
    /// Creates a new support ticket.
    ///
    /// Only administrators and customers are allowed to create tickets.
    /// Support agents are intentionally excluded.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Customer")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TicketResponse>> Create(
        [FromBody] CreateTicketRequest request)
    {
        var response =
            await _ticketService.CreateAsync(
                request,
                GetUserId(),
                GetRole());

        return CreatedAtAction(
            nameof(GetById),
            new { id = response.Id },
            response);
    }

    /// <summary>
    /// Retrieves a paginated collection of support tickets.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(TicketQueryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<TicketQueryResponse>> GetAll(
        [FromQuery] TicketQueryRequest request)
    {
        var response =
            await _ticketService.GetAllAsync(
                request,
                GetUserId(),
                GetRole());

        return Ok(response);
    }

    /// <summary>
    /// Retrieves a support ticket by identifier.
    /// </summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TicketResponse>> GetById(
        long id)
    {
        var response =
            await _ticketService.GetByIdAsync(
                id,
                GetUserId(),
                GetRole());

        if (response is null)
        {
            return NotFound();
        }

        return Ok(response);
    }

    /// <summary>
    /// Retrieves the complete details of a support ticket.
    /// </summary>
    [HttpGet("{id:long}/details")]
    [ProducesResponseType(
        typeof(TicketDetailsResponse),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TicketDetailsResponse>> GetDetails(
        long id)
    {
        var response =
            await _ticketService.GetDetailsAsync(
                id,
                GetUserId(),
                GetRole());

        if (response is null)
        {
            return NotFound();
        }

        return Ok(response);
    }

    /// <summary>
    /// Updates an existing support ticket.
    /// </summary>
    [HttpPut("{id:long}")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TicketResponse>> Update(
        long id,
        [FromBody] UpdateTicketRequest request)
    {
        var response =
            await _ticketService.UpdateAsync(
                id,
                request,
                GetUserId(),
                GetRole());

        if (response is null)
        {
            return NotFound();
        }

        return Ok(response);
    }

    /// <summary>
    /// Assigns a support ticket to an agent.
    /// </summary>
    [HttpPatch("{id:long}/assign")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TicketResponse>> Assign(
        long id,
        [FromBody] AssignTicketRequest request)
    {
        var response =
            await _ticketService.AssignAsync(
                id,
                request,
                GetUserId(),
                GetRole());

        if (response is null)
        {
            return NotFound();
        }

        return Ok(response);
    }

    /// <summary>
    /// Changes the workflow status of a support ticket.
    /// </summary>
    [HttpPatch("{id:long}/status")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TicketResponse>> UpdateStatus(
        long id,
        [FromBody] UpdateTicketStatusRequest request)
    {
        var response =
            await _ticketService.UpdateStatusAsync(
                id,
                request,
                GetUserId(),
                GetRole());

        if (response is null)
        {
            return NotFound();
        }

        return Ok(response);
    }

    /// <summary>
    /// Gets the authenticated user's identifier from the JWT.
    /// </summary>
    private string GetUserId()
    {
        return User.FindFirstValue(
                   ClaimTypes.NameIdentifier)
               ?? throw new UnauthorizedAccessException(
                   "The authenticated user's identifier is missing.");
    }

    /// <summary>
    /// Gets the authenticated user's role from the JWT.
    /// </summary>
    private string GetRole()
    {
        return User.FindFirstValue(
                   ClaimTypes.Role)
               ?? throw new UnauthorizedAccessException(
                   "The authenticated user's role is missing.");
    }
}