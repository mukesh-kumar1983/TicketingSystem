using System.ComponentModel.DataAnnotations;

namespace TicketingSystem.Application.DTOs.Tickets;

/// <summary>
/// Represents a request to assign a ticket to a support agent.
/// </summary>
public sealed class AssignTicketRequest
{
    /// <summary>
    /// Gets or sets the identifier of the support agent.
    /// </summary>
    [Required]
    public string AgentId { get; set; } = string.Empty;
}