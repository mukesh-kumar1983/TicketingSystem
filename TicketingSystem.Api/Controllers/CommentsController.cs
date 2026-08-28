using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketingSystem.Application.DTOs.Comments;
using TicketingSystem.Application.Interfaces;

namespace TicketingSystem.Api.Controllers;

/// <summary>
/// Provides HTTP API endpoints for ticket comments.
/// </summary>
[ApiController]
[Route("api/tickets/{ticketId:long}/comments")]
[Authorize]
public sealed class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    /// <summary>
    /// Initializes a new instance of the <see cref="CommentsController"/> class.
    /// </summary>
    /// <param name="commentService">The comment application service.</param>
    public CommentsController(
        ICommentService commentService)
    {
        _commentService = commentService;
    }

    /// <summary>
    /// Retrieves all comments belonging to a ticket.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<CommentResponse>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<CommentResponse>>> GetByTicket(
        long ticketId)
    {
        var comments =
            await _commentService.GetByTicketAsync(
                ticketId,
                GetUserId(),
                GetRole());

        return Ok(comments);
    }

    /// <summary>
    /// Adds a comment to a ticket.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(
        typeof(CommentResponse),
        StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CommentResponse>> Create(
        long ticketId,
        [FromBody] CreateCommentRequest request)
    {
        var response =
            await _commentService.CreateAsync(
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