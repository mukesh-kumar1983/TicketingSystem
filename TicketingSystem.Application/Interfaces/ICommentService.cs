using TicketingSystem.Application.DTOs.Comments;

namespace TicketingSystem.Application.Interfaces;

/// <summary>
/// Defines application operations for ticket comments.
/// </summary>
public interface ICommentService
{
    /// <summary>
    /// Retrieves all comments belonging to a ticket.
    /// </summary>
    /// <param name="ticketId">The ticket identifier.</param>
    /// <param name="userId">The authenticated user's identifier.</param>
    /// <param name="role">The authenticated user's role.</param>
    /// <returns>The ticket comments.</returns>
    Task<IReadOnlyList<CommentResponse>> GetByTicketAsync(
        long ticketId,
        string userId,
        string role);

    /// <summary>
    /// Adds a comment to a ticket.
    /// </summary>
    /// <param name="ticketId">The ticket identifier.</param>
    /// <param name="request">The comment request.</param>
    /// <param name="userId">The authenticated user's identifier.</param>
    /// <param name="role">The authenticated user's role.</param>
    /// <returns>The newly created comment.</returns>
    Task<CommentResponse> CreateAsync(
        long ticketId,
        CreateCommentRequest request,
        string userId,
        string role);
}