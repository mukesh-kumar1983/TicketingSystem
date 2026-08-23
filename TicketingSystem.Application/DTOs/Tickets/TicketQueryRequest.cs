using TicketingSystem.Domain.Enums;

namespace TicketingSystem.Application.DTOs.Tickets;

/// <summary>
/// Represents filtering, searching, sorting, and pagination options for tickets.
/// </summary>
public sealed class TicketQueryRequest
{
    /// <summary>
    /// Gets or sets the requested page number.
    /// </summary>
    public int PageNumber { get; set; } = 1;

    /// <summary>
    /// Gets or sets the number of records returned per page.
    /// </summary>
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// Gets or sets an optional search term applied to ticket title and description.
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// Gets or sets an optional ticket status filter.
    /// </summary>
    public TicketStatus? Status { get; set; }

    /// <summary>
    /// Gets or sets an optional ticket priority filter.
    /// </summary>
    public TicketPriority? Priority { get; set; }

    /// <summary>
    /// Gets or sets an optional assigned-agent filter.
    /// </summary>
    public string? AssignedAgentId { get; set; }

    /// <summary>
    /// Gets or sets the property used for sorting.
    /// </summary>
    public string SortBy { get; set; } = "CreatedAt";

    /// <summary>
    /// Gets or sets whether the results should be sorted in descending order.
    /// </summary>
    public bool SortDescending { get; set; } = true;
}