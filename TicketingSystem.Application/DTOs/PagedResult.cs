namespace TicketingSystem.Application.DTOs;

/// <summary>
/// Represents a paginated collection of results.
/// </summary>
/// <typeparam name="T">The type of item contained in the result.</typeparam>
public sealed class PagedResult<T>
{
    /// <summary>
    /// Gets or sets the items returned for the current page.
    /// </summary>
    public IReadOnlyCollection<T> Items { get; set; } = [];

    /// <summary>
    /// Gets or sets the current page number.
    /// </summary>
    public int PageNumber { get; set; }

    /// <summary>
    /// Gets or sets the number of items requested per page.
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Gets or sets the total number of matching records.
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Gets the total number of available pages.
    /// </summary>
    public int TotalPages =>
        PageSize <= 0
            ? 0
            : (int)Math.Ceiling(TotalCount / (double)PageSize);
}