using System.ComponentModel.DataAnnotations;

namespace TicketingSystem.Application.DTOs.TimeEntries;

/// <summary>
/// Represents the information required to record work performed on a ticket.
/// </summary>
public sealed class CreateTimeEntryRequest
{
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
    [Required]
    [StringLength(2000)]
    public string Description { get; set; } = string.Empty;
}