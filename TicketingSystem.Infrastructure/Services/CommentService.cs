using Microsoft.EntityFrameworkCore;
using TicketingSystem.Application.DTOs.Comments;
using TicketingSystem.Application.Interfaces;
using TicketingSystem.Domain.Entities;
using TicketingSystem.Domain.Enums;
using TicketingSystem.Infrastructure.Persistence;

namespace TicketingSystem.Infrastructure.Services;

/// <summary>
/// Provides persistence-backed operations for ticket comments.
/// </summary>
public sealed class CommentService : ICommentService
{
    private readonly TicketingSystemDbContext _dbContext;

    /// <summary>
    /// Initializes a new instance of the <see cref="CommentService"/> class.
    /// </summary>
    /// <param name="dbContext">The ticketing system database context.</param>
    public CommentService(
        TicketingSystemDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<CommentResponse>> GetByTicketAsync(
        long ticketId,
        string userId,
        string role)
    {
        var ticket = await GetAuthorizedTicketAsync(
            ticketId,
            userId,
            role);

        if (ticket is null)
        {
            return Array.Empty<CommentResponse>();
        }

        var comments = await _dbContext.Comments
            .AsNoTracking()
            .Where(comment => comment.TicketId == ticketId)
            .OrderBy(comment => comment.CreatedAt)
            .ToListAsync();

        if (comments.Count == 0)
        {
            return Array.Empty<CommentResponse>();
        }

        var userIds = comments
            .Select(comment => comment.UserId)
            .Distinct()
            .ToList();

        var users = await _dbContext.Users
            .AsNoTracking()
            .Where(user => userIds.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id);

        return comments
            .Select(
                comment =>
                {
                    users.TryGetValue(
                        comment.UserId,
                        out var user);

                    return new CommentResponse
                    {
                        Id = comment.Id,
                        TicketId = comment.TicketId,
                        UserId = comment.UserId,
                        UserName = user is null
                            ? string.Empty
                            : BuildFullName(user),
                        Content = comment.Content,
                        CreatedAt = comment.CreatedAt
                    };
                })
            .ToList();
    }

    /// <inheritdoc />
    public async Task<CommentResponse> CreateAsync(
        long ticketId,
        CreateCommentRequest request,
        string userId,
        string role)
    {
        var ticket = await GetAuthorizedTicketAsync(
            ticketId,
            userId,
            role);

        if (ticket is null)
        {
            throw new KeyNotFoundException(
                "The specified ticket does not exist.");
        }

        var now = DateTime.UtcNow;

        var comment = new Comment
        {
            TicketId = ticketId,
            UserId = userId,
            Content = request.Content.Trim(),
            CreatedAt = now
        };

        _dbContext.Comments.Add(comment);

        ticket.UpdatedAt = now;

        _dbContext.Activities.Add(
            new Activity
            {
                TicketId = ticketId,
                UserId = userId,
                ActivityType = "CommentAdded",
                Description = "A comment was added to the ticket.",
                CreatedAt = now
            });

        await _dbContext.SaveChangesAsync();

        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Id == userId);

        return new CommentResponse
        {
            Id = comment.Id,
            TicketId = comment.TicketId,
            UserId = comment.UserId,
            UserName = user is null
                ? string.Empty
                : BuildFullName(user),
            Content = comment.Content,
            CreatedAt = comment.CreatedAt
        };
    }

    /// <summary>
    /// Retrieves a ticket and ensures that the current user may access it.
    /// </summary>
    private async Task<Ticket?> GetAuthorizedTicketAsync(
        long ticketId,
        string userId,
        string role)
    {
        var ticket = await _dbContext.Tickets
            .FirstOrDefaultAsync(
                item => item.Id == ticketId);

        if (ticket is null)
        {
            return null;
        }

        var isAdmin =
            string.Equals(
                role,
                UserRole.Admin.ToString(),
                StringComparison.OrdinalIgnoreCase);

        var isCustomer =
            string.Equals(
                role,
                UserRole.Customer.ToString(),
                StringComparison.OrdinalIgnoreCase);

        var isAgent =
            string.Equals(
                role,
                UserRole.SupportAgent.ToString(),
                StringComparison.OrdinalIgnoreCase);

        var allowed =
            isAdmin ||
            (isCustomer && ticket.CustomerId == userId) ||
            (isAgent && ticket.AssignedAgentId == userId);

        if (!allowed)
        {
            throw new UnauthorizedAccessException(
                "You are not authorized to access this ticket.");
        }

        return ticket;
    }

    /// <summary>
    /// Creates a display name for an application user.
    /// </summary>
    private static string BuildFullName(
        Infrastructure.Identity.ApplicationUser user)
    {
        var fullName =
            $"{user.FirstName} {user.LastName}".Trim();

        return string.IsNullOrWhiteSpace(fullName)
            ? user.Email ?? user.UserName ?? user.Id
            : fullName;
    }
}