namespace TicketingSystem.Domain.Enums;

/// <summary>
/// Represents the business priority assigned to a support ticket.
/// </summary>
public enum TicketPriority
{
    /// <summary>
    /// Low-priority ticket.
    /// </summary>
    Low = 1,

    /// <summary>
    /// Normal-priority ticket.
    /// </summary>
    Medium = 2,

    /// <summary>
    /// High-priority ticket requiring increased attention.
    /// </summary>
    High = 3,

    /// <summary>
    /// Critical ticket requiring immediate attention.
    /// </summary>
    Critical = 4
}