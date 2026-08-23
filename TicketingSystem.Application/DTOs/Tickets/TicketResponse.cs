using TicketingSystem.Domain.Enums;

namespace TicketingSystem.Application.DTOs.Tickets;

/// <summary>
/// Represents a support ticket returned by the application.
/// </summary>
public sealed class TicketResponse
{
    /// <summary>
    /// Gets or sets the unique ticket identifier.
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// Gets or sets the ticket title.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the ticket description.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the current ticket status.
    /// </summary>
    public TicketStatus Status { get; set; }

    /// <summary>
    /// Gets or sets the ticket priority.
    /// </summary>
    public TicketPriority Priority { get; set; }

    /// <summary>
    /// Gets or sets the customer identifier.
    /// </summary>
    public string CustomerId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the customer's full name.
    /// </summary>
    public string CustomerName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the assigned support agent identifier.
    /// </summary>
    public string? AssignedAgentId { get; set; }

    /// <summary>
    /// Gets or sets the assigned support agent's full name.
    /// </summary>
    public string? AssignedAgentName { get; set; }

    /// <summary>
    /// Gets or sets the ticket creation date and time.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the last update date and time.
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Gets or sets the total time recorded against the ticket.
    /// </summary>
    public TimeSpan TotalWorkTime { get; set; }
}