using TicketingSystem.Application.DTOs.Activities;
using TicketingSystem.Application.DTOs.Comments;
using TicketingSystem.Application.DTOs.TimeEntries;

namespace TicketingSystem.Application.DTOs.Tickets;

/// <summary>
/// Represents the complete details of a support ticket, including
/// comments, activity history, and recorded work.
/// </summary>
public sealed class TicketDetailsResponse
{
    /// <summary>
    /// Gets or sets the ticket information.
    /// </summary>
    public TicketResponse Ticket { get; set; } = new();

    /// <summary>
    /// Gets or sets the comments associated with the ticket.
    /// </summary>
    public IReadOnlyList<CommentResponse> Comments { get; set; } =
        Array.Empty<CommentResponse>();

    /// <summary>
    /// Gets or sets the activity history associated with the ticket.
    /// </summary>
    public IReadOnlyList<ActivityResponse> Activities { get; set; } =
        Array.Empty<ActivityResponse>();

    /// <summary>
    /// Gets or sets the work entries recorded against the ticket.
    /// </summary>
    public IReadOnlyList<TimeEntryResponse> TimeEntries { get; set; } =
        Array.Empty<TimeEntryResponse>();

    /// <summary>
    /// Gets the total amount of time recorded against the ticket.
    /// </summary>
    public TimeSpan TotalWorkTime =>
        TimeEntries.Aggregate(
            TimeSpan.Zero,
            (total, entry) => total + entry.Duration);
}