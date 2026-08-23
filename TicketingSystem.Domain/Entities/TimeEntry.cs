namespace TicketingSystem.Domain.Entities;

/// <summary>
/// Represents a period of work recorded by a support agent for a ticket.
/// </summary>
public class TimeEntry
{
    /// <summary>
    /// Gets or sets the unique identifier of the time entry.
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the ticket associated with the work.
    /// </summary>
    public long TicketId { get; set; }

    /// <summary>
    /// Gets or sets the identifier of the support agent who performed the work.
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the date on which the work was performed.
    /// </summary>
    public DateTime WorkDate { get; set; }

    /// <summary>
    /// Gets or sets the amount of time spent working on the ticket.
    /// </summary>
    public TimeSpan Duration { get; set; }

    /// <summary>
    /// Gets or sets a description of the work performed.
    /// </summary>
    public string Description { get; set; } = string.Empty;
}