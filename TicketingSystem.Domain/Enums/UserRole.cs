namespace TicketingSystem.Domain.Enums;

/// <summary>
/// Represents the roles supported by the ticketing system.
/// </summary>
public enum UserRole
{
    /// <summary>
    /// System administrator with full ticket management permissions.
    /// </summary>
    Admin = 1,

    /// <summary>
    /// Support employee responsible for handling assigned tickets.
    /// </summary>
    SupportAgent = 2,

    /// <summary>
    /// Customer who creates and manages their own support tickets.
    /// </summary>
    Customer = 3
}