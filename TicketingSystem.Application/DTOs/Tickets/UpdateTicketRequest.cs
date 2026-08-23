using System.ComponentModel.DataAnnotations;
using TicketingSystem.Domain.Enums;

namespace TicketingSystem.Application.DTOs.Tickets;

/// <summary>
/// Represents the information that can be changed on an existing ticket.
/// </summary>
public sealed class UpdateTicketRequest
{
    /// <summary>
    /// Gets or sets the ticket title.
    /// </summary>
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the ticket description.
    /// </summary>
    [Required]
    [StringLength(5000)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the ticket priority.
    /// </summary>
    public TicketPriority Priority { get; set; }
}