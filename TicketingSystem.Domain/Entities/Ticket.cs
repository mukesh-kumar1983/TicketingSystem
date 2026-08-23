using TicketingSystem.Domain.Enums;

namespace TicketingSystem.Domain.Entities;

/// <summary>
/// Represents a customer support ticket.
/// </summary>
public class Ticket
{
    /// <summary>
    /// Gets or sets the unique identifier of the ticket.
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// Gets or sets the title of the ticket.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the detailed description of the customer's issue.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the current workflow status of the ticket.
    /// </summary>
    public TicketStatus Status { get; set; } = TicketStatus.Open;

    /// <summary>
    /// Gets or sets the priority of the ticket.
    /// </summary>
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;

    /// <summary>
    /// Gets or sets the identifier of the customer who created the ticket.
    /// </summary>
    public string CustomerId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the identifier of the support agent assigned to the ticket.
    /// </summary>
    public string? AssignedAgentId { get; set; }

    /// <summary>
    /// Gets or sets the date and time when the ticket was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the date and time when the ticket was last updated.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}