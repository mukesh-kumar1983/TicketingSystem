using System.ComponentModel.DataAnnotations;
using TicketingSystem.Domain.Enums;

namespace TicketingSystem.Application.DTOs.Tickets;

/// <summary>
/// Represents the information required to create a new support ticket.
/// </summary>
public sealed class CreateTicketRequest
{
    /// <summary>
    /// Gets or sets the title of the ticket.
    /// </summary>
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the description of the customer's issue.
    /// </summary>
    [Required]
    [StringLength(5000)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the priority assigned to the ticket.
    /// </summary>
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
}