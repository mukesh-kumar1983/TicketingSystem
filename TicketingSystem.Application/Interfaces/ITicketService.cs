using TicketingSystem.Application.DTOs.Tickets;

namespace TicketingSystem.Application.Interfaces;

/// <summary>
/// Defines application operations for managing support tickets.
/// </summary>
public interface ITicketService
{
    /// <summary>
    /// Creates a new support ticket.
    /// </summary>
    /// <param name="request">The ticket creation request.</param>
    /// <param name="userId">The authenticated user's identifier.</param>
    /// <param name="role">The authenticated user's role.</param>
    /// <returns>The newly created ticket.</returns>
    Task<TicketResponse> CreateAsync(
        CreateTicketRequest request,
        string userId,
        string role);

    /// <summary>
    /// Retrieves a paginated collection of tickets.
    /// </summary>
    /// <param name="request">The filtering and pagination options.</param>
    /// <param name="userId">The authenticated user's identifier.</param>
    /// <param name="role">The authenticated user's role.</param>
    /// <returns>A paginated ticket result.</returns>
    Task<TicketQueryResponse> GetAllAsync(
        TicketQueryRequest request,
        string userId,
        string role);

    /// <summary>
    /// Retrieves a ticket by identifier.
    /// </summary>
    /// <param name="ticketId">The ticket identifier.</param>
    /// <param name="userId">The authenticated user's identifier.</param>
    /// <param name="role">The authenticated user's role.</param>
    /// <returns>The requested ticket.</returns>
    Task<TicketResponse?> GetByIdAsync(
        long ticketId,
        string userId,
        string role);

    /// <summary>
    /// Retrieves the complete ticket details, including comments,
    /// activities, and time entries.
    /// </summary>
    /// <param name="ticketId">The ticket identifier.</param>
    /// <param name="userId">The authenticated user's identifier.</param>
    /// <param name="role">The authenticated user's role.</param>
    /// <returns>
    /// The complete ticket details, or <see langword="null"/> when
    /// the ticket does not exist.
    /// </returns>
    Task<TicketDetailsResponse?> GetDetailsAsync(
        long ticketId,
        string userId,
        string role);

    /// <summary>
    /// Updates an existing ticket.
    /// </summary>
    /// <param name="ticketId">The ticket identifier.</param>
    /// <param name="request">The update request.</param>
    /// <param name="userId">The authenticated user's identifier.</param>
    /// <param name="role">The authenticated user's role.</param>
    /// <returns>The updated ticket.</returns>
    Task<TicketResponse?> UpdateAsync(
        long ticketId,
        UpdateTicketRequest request,
        string userId,
        string role);

    /// <summary>
    /// Assigns a ticket to a support agent.
    /// </summary>
    /// <param name="ticketId">The ticket identifier.</param>
    /// <param name="request">The assignment request.</param>
    /// <param name="userId">The authenticated user's identifier.</param>
    /// <param name="role">The authenticated user's role.</param>
    /// <returns>The updated ticket.</returns>
    Task<TicketResponse?> AssignAsync(
        long ticketId,
        AssignTicketRequest request,
        string userId,
        string role);

    /// <summary>
    /// Changes the status of a ticket.
    /// </summary>
    /// <param name="ticketId">The ticket identifier.</param>
    /// <param name="request">The status change request.</param>
    /// <param name="userId">The authenticated user's identifier.</param>
    /// <param name="role">The authenticated user's role.</param>
    /// <returns>The updated ticket.</returns>
    Task<TicketResponse?> UpdateStatusAsync(
        long ticketId,
        UpdateTicketStatusRequest request,
        string userId,
        string role);
}