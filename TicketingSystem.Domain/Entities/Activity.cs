namespace TicketingSystem.Domain.Entities;

/// <summary>
/// Represents an activity recorded against a support ticket.
/// </summary>
public class Activity
{
    /// <summary>
    /// Gets or sets the unique identifier of the activity.
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the ticket associated with the activity.
    /// </summary>
    public long TicketId { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the user who performed the activity.
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets a short description of the activity.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the type of activity that occurred.
    /// </summary>
    public string ActivityType { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the date and time when the activity occurred.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}