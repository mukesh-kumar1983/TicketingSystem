namespace TicketingSystem.Application.DTOs.TimeEntries;

/// <summary>
/// Represents recorded work returned by the application.
/// </summary>
public sealed class TimeEntryResponse
{
    /// <summary>
    /// Gets or sets the time-entry identifier.
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// Gets or sets the ticket identifier.
    /// </summary>
    public long TicketId { get; set; }

    /// <summary>
    /// Gets or sets the support agent identifier.
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the support agent's name.
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the work date.
    /// </summary>
    public DateTime WorkDate { get; set; }

    /// <summary>
    /// Gets or sets the recorded duration.
    /// </summary>
    public TimeSpan Duration { get; set; }

    /// <summary>
    /// Gets or sets the work description.
    /// </summary>
    public string Description { get; set; } = string.Empty;
}