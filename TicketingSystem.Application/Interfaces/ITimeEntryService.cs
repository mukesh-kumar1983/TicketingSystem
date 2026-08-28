using TicketingSystem.Application.DTOs.TimeEntries;

namespace TicketingSystem.Application.Interfaces;

/// <summary>
/// Defines application operations for recording ticket work.
/// </summary>
public interface ITimeEntryService
{
    /// <summary>
    /// Retrieves all work entries recorded against a ticket.
    /// </summary>
    Task<IReadOnlyList<TimeEntryResponse>> GetByTicketAsync(
        long ticketId,
        string userId,
        string role);

    /// <summary>
    /// Records work performed against a ticket.
    /// </summary>
    Task<TimeEntryResponse> CreateAsync(
        long ticketId,
        CreateTimeEntryRequest request,
        string userId,
        string role);
}