using System.ComponentModel.DataAnnotations;
using TicketingSystem.Domain.Enums;

namespace TicketingSystem.Application.DTOs.Tickets;

/// <summary>
/// Represents a request to change the workflow status of a support ticket.
/// </summary>
public sealed class UpdateTicketStatusRequest
{
    /// <summary>
    /// Gets or sets the new status of the ticket.
    /// </summary>
    [Required]
    public TicketStatus Status { get; set; }
}