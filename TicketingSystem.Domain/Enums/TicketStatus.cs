namespace TicketingSystem.Domain.Enums;

/// <summary>
/// Represents the current workflow state of a support ticket.
/// </summary>
public enum TicketStatus
{
    /// <summary>
    /// The ticket has been created but work has not started.
    /// </summary>
    Open = 1,

    /// <summary>
    /// A support agent is actively working on the ticket.
    /// </summary>
    InProgress = 2,

    /// <summary>
    /// The reported issue has been resolved and is awaiting closure.
    /// </summary>
    Resolved = 3,

    /// <summary>
    /// The ticket has been completed and closed.
    /// </summary>
    Closed = 4
}