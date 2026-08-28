using Microsoft.EntityFrameworkCore;
using TicketingSystem.Application.DTOs.TimeEntries;
using TicketingSystem.Application.Interfaces;
using TicketingSystem.Domain.Entities;
using TicketingSystem.Domain.Enums;
using TicketingSystem.Infrastructure.Identity;
using TicketingSystem.Infrastructure.Persistence;

namespace TicketingSystem.Infrastructure.Services;

/// <summary>
/// Provides persistence-backed operations for ticket work entries.
/// </summary>
public sealed class TimeEntryService : ITimeEntryService
{
    private readonly TicketingSystemDbContext _dbContext;

    /// <summary>
    /// Initializes a new instance of the <see cref="TimeEntryService"/> class.
    /// </summary>
    /// <param name="dbContext">The ticketing system database context.</param>
    public TimeEntryService(
        TicketingSystemDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<TimeEntryResponse>> GetByTicketAsync(
        long ticketId,
        string userId,
        string role)
    {
        await EnsureCanAccessTicketAsync(
            ticketId,
            userId,
            role);

        var entries = await _dbContext.TimeEntries
            .AsNoTracking()
            .Where(entry => entry.TicketId == ticketId)
            .OrderBy(entry => entry.WorkDate)
            .ThenBy(entry => entry.Id)
            .ToListAsync();

        if (entries.Count == 0)
        {
            return Array.Empty<TimeEntryResponse>();
        }

        var userIds = entries
            .Select(entry => entry.UserId)
            .Distinct()
            .ToList();

        var users = await _dbContext.Users
            .AsNoTracking()
            .Where(user => userIds.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id);

        return entries
            .Select(
                entry =>
                {
                    users.TryGetValue(
                        entry.UserId,
                        out var user);

                    return new TimeEntryResponse
                    {
                        Id = entry.Id,
                        TicketId = entry.TicketId,
                        UserId = entry.UserId,
                        UserName = user is null
                            ? string.Empty
                            : BuildFullName(user),
                        WorkDate = entry.WorkDate,
                        Duration = entry.Duration,
                        Description = entry.Description
                    };
                })
            .ToList();
    }

    /// <inheritdoc />
    public async Task<TimeEntryResponse> CreateAsync(
        long ticketId,
        CreateTimeEntryRequest request,
        string userId,
        string role)
    {
        if (!IsAdmin(role) &&
            !IsSupportAgent(role))
        {
            throw new UnauthorizedAccessException(
                "Only administrators and support agents can record work.");
        }

        var ticket = await _dbContext.Tickets
            .FirstOrDefaultAsync(
                item => item.Id == ticketId);

        if (ticket is null)
        {
            throw new KeyNotFoundException(
                "The specified ticket does not exist.");
        }

        if (IsSupportAgent(role) &&
            ticket.AssignedAgentId != userId)
        {
            throw new UnauthorizedAccessException(
                "You can only record work against tickets assigned to you.");
        }

        if (request.Duration <= TimeSpan.Zero)
        {
            throw new ArgumentException(
                "Duration must be greater than zero.");
        }

        if (request.Duration > TimeSpan.FromHours(24))
        {
            throw new ArgumentException(
                "Duration cannot exceed 24 hours.");
        }

        var now = DateTime.UtcNow;

        var entry = new TimeEntry
        {
            TicketId = ticketId,
            UserId = userId,
            WorkDate = request.WorkDate == default
                ? now
                : request.WorkDate,
            Duration = request.Duration,
            Description = request.Description.Trim()
        };

        _dbContext.TimeEntries.Add(entry);

        ticket.UpdatedAt = now;

        _dbContext.Activities.Add(
            new Activity
            {
                TicketId = ticketId,
                UserId = userId,
                ActivityType = "TimeRecorded",
                Description =
                    $"Work time recorded: {request.Duration}.",
                CreatedAt = now
            });

        await _dbContext.SaveChangesAsync();

        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Id == userId);

        return new TimeEntryResponse
        {
            Id = entry.Id,
            TicketId = entry.TicketId,
            UserId = entry.UserId,
            UserName = user is null
                ? string.Empty
                : BuildFullName(user),
            WorkDate = entry.WorkDate,
            Duration = entry.Duration,
            Description = entry.Description
        };
    }

    /// <summary>
    /// Ensures that the current user can access the ticket.
    /// </summary>
    private async Task EnsureCanAccessTicketAsync(
        long ticketId,
        string userId,
        string role)
    {
        var ticket = await _dbContext.Tickets
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Id == ticketId);

        if (ticket is null)
        {
            throw new KeyNotFoundException(
                "The specified ticket does not exist.");
        }

        if (IsAdmin(role))
        {
            return;
        }

        if (IsCustomer(role) &&
            ticket.CustomerId == userId)
        {
            return;
        }

        if (IsSupportAgent(role) &&
            ticket.AssignedAgentId == userId)
        {
            return;
        }

        throw new UnauthorizedAccessException(
            "You are not authorized to access this ticket.");
    }

    /// <summary>
    /// Determines whether the user is an administrator.
    /// </summary>
    private static bool IsAdmin(string role)
    {
        return string.Equals(
            role,
            UserRole.Admin.ToString(),
            StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Determines whether the user is a support agent.
    /// </summary>
    private static bool IsSupportAgent(string role)
    {
        return string.Equals(
            role,
            UserRole.SupportAgent.ToString(),
            StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Determines whether the user is a customer.
    /// </summary>
    private static bool IsCustomer(string role)
    {
        return string.Equals(
            role,
            UserRole.Customer.ToString(),
            StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Creates a display name for an application user.
    /// </summary>
    private static string BuildFullName(
        ApplicationUser user)
    {
        var fullName =
            $"{user.FirstName} {user.LastName}".Trim();

        return string.IsNullOrWhiteSpace(fullName)
            ? user.Email ?? user.UserName ?? user.Id
            : fullName;
    }
}