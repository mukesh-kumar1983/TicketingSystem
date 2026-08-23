namespace TicketingSystem.Application.DTOs.Comments;

/// <summary>
/// Represents a comment returned by the application.
/// </summary>
public sealed class CommentResponse
{
    /// <summary>
    /// Gets or sets the comment identifier.
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// Gets or sets the ticket identifier.
    /// </summary>
    public long TicketId { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the user who created the comment.
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the name of the user who created the comment.
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the comment content.
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the comment creation date and time.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}