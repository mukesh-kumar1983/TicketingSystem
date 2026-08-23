namespace TicketingSystem.Domain.Entities;

/// <summary>
/// Represents a comment added to a support ticket.
/// </summary>
public class Comment
{
    /// <summary>
    /// Gets or sets the unique identifier of the comment.
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the ticket associated with the comment.
    /// </summary>
    public long TicketId { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the user who created the comment.
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the comment text.
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the date and time when the comment was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}