namespace TicketingSystem.Application.DTOs.Tickets;

/// <summary>
/// Represents a paginated collection of support tickets.
/// </summary>
public sealed class TicketQueryResponse
{
    /// <summary>
    /// Gets or sets the tickets returned for the requested page.
    /// </summary>
    public IReadOnlyList<TicketResponse> Items { get; init; } =
        Array.Empty<TicketResponse>();

    /// <summary>
    /// Gets or sets the total number of tickets matching the query.
    /// </summary>
    public int TotalCount { get; init; }

    /// <summary>
    /// Gets or sets the requested page number.
    /// </summary>
    public int PageNumber { get; init; }

    /// <summary>
    /// Gets or sets the requested page size.
    /// </summary>
    public int PageSize { get; init; }

    /// <summary>
    /// Gets the total number of pages.
    /// </summary>
    public int TotalPages =>
        PageSize <= 0
            ? 0
            : (int)Math.Ceiling(
                TotalCount / (double)PageSize);
}