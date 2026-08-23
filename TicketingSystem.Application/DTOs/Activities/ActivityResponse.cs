namespace TicketingSystem.Application.DTOs.Activities;

/// <summary>
/// Represents an activity displayed in a ticket's activity timeline.
/// </summary>
public sealed class ActivityResponse
{
    /// <summary>
    /// Gets or sets the activity identifier.
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// Gets or sets the ticket identifier.
    /// </summary>
    public long TicketId { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the user who performed the activity.
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the name of the user who performed the activity.
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the activity type.
    /// </summary>
    public string ActivityType { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the activity description.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the activity creation date and time.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}