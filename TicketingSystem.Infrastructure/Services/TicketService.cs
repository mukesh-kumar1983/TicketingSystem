using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TicketingSystem.Application.DTOs.Tickets;
using TicketingSystem.Application.Interfaces;
using TicketingSystem.Domain.Entities;
using TicketingSystem.Domain.Enums;
using TicketingSystem.Infrastructure.Identity;
using TicketingSystem.Infrastructure.Persistence;

namespace TicketingSystem.Infrastructure.Services;

/// <summary>
/// Provides persistence-backed operations for support tickets.
/// </summary>
public sealed class TicketService : ITicketService
{
    private readonly TicketingSystemDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;

    /// <summary>
    /// Initializes a new instance of the <see cref="TicketService"/> class.
    /// </summary>
    /// <param name="dbContext">The ticketing system database context.</param>
    /// <param name="userManager">The ASP.NET Core Identity user manager.</param>
    public TicketService(
        TicketingSystemDbContext dbContext,
        UserManager<ApplicationUser> userManager)
    {
        _dbContext = dbContext;
        _userManager = userManager;
    }

    /// <inheritdoc />
    public async Task<TicketResponse> CreateAsync(
        CreateTicketRequest request,
        string userId,
        string role)
    {
        EnsureAuthenticated(userId, role);

        var now = DateTime.UtcNow;

        var ticket = new Ticket
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Priority = request.Priority,
            Status = TicketStatus.Open,
            CustomerId = userId,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.Tickets.Add(ticket);

        await _dbContext.SaveChangesAsync();

        _dbContext.Activities.Add(
            new Activity
            {
                TicketId = ticket.Id,
                UserId = userId,
                ActivityType = "Created",
                Description = "Ticket created.",
                CreatedAt = now
            });

        await _dbContext.SaveChangesAsync();

        return await BuildResponseAsync(ticket);
    }

    /// <inheritdoc />
    public async Task<TicketQueryResponse> GetAllAsync(
        TicketQueryRequest request,
        string userId,
        string role)
    {
        EnsureAuthenticated(userId, role);

        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        IQueryable<Ticket> query =
            _dbContext.Tickets.AsNoTracking();

        if (IsCustomer(role))
        {
            query = query.Where(
                ticket => ticket.CustomerId == userId);
        }
        else if (IsSupportAgent(role))
        {
            query = query.Where(
                ticket => ticket.AssignedAgentId == userId);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();

            query = query.Where(
                ticket =>
                    ticket.Title.Contains(search) ||
                    ticket.Description.Contains(search));
        }

        if (request.Status.HasValue)
        {
            query = query.Where(
                ticket => ticket.Status == request.Status.Value);
        }

        if (request.Priority.HasValue)
        {
            query = query.Where(
                ticket => ticket.Priority == request.Priority.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.AssignedAgentId))
        {
            query = query.Where(
                ticket =>
                    ticket.AssignedAgentId ==
                    request.AssignedAgentId);
        }

        query = ApplySorting(
            query,
            request.SortBy,
            request.SortDescending);

        var totalCount = await query.CountAsync();

        var tickets = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var responses = await BuildResponsesAsync(tickets);

        return new TicketQueryResponse
        {
            Items = responses,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    /// <inheritdoc />
    public async Task<TicketResponse?> GetByIdAsync(
        long ticketId,
        string userId,
        string role)
    {
        EnsureAuthenticated(userId, role);

        var ticket = await _dbContext.Tickets
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Id == ticketId);

        if (ticket is null)
        {
            return null;
        }

        EnsureCanView(ticket, userId, role);

        return await BuildResponseAsync(ticket);
    }

    /// <inheritdoc />
    public async Task<TicketDetailsResponse?> GetDetailsAsync(
        long ticketId,
        string userId,
        string role)
    {
        EnsureAuthenticated(userId, role);

        var ticket = await _dbContext.Tickets
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Id == ticketId);

        if (ticket is null)
        {
            return null;
        }

        EnsureCanView(ticket, userId, role);

        var ticketResponse =
            await BuildResponseAsync(ticket);

        var comments = await BuildCommentsAsync(
            ticketId);

        var activities = await BuildActivitiesAsync(
            ticketId);

        var timeEntries = await BuildTimeEntriesAsync(
            ticketId);

        return new TicketDetailsResponse
        {
            Ticket = ticketResponse,
            Comments = comments,
            Activities = activities,
            TimeEntries = timeEntries
        };
    }

    /// <inheritdoc />
    public async Task<TicketResponse?> UpdateAsync(
        long ticketId,
        UpdateTicketRequest request,
        string userId,
        string role)
    {
        EnsureAuthenticated(userId, role);

        var ticket = await _dbContext.Tickets
            .FirstOrDefaultAsync(
                item => item.Id == ticketId);

        if (ticket is null)
        {
            return null;
        }

        EnsureCanModify(ticket, userId, role);

        ticket.Title = request.Title.Trim();
        ticket.Description = request.Description.Trim();
        ticket.Priority = request.Priority;
        ticket.UpdatedAt = DateTime.UtcNow;

        _dbContext.Activities.Add(
            new Activity
            {
                TicketId = ticket.Id,
                UserId = userId,
                ActivityType = "Updated",
                Description = "Ticket details updated.",
                CreatedAt = ticket.UpdatedAt
            });

        await _dbContext.SaveChangesAsync();

        return await BuildResponseAsync(ticket);
    }

    /// <inheritdoc />
    public async Task<TicketResponse?> AssignAsync(
        long ticketId,
        AssignTicketRequest request,
        string userId,
        string role)
    {
        EnsureAuthenticated(userId, role);

        if (!IsAdmin(role))
        {
            throw new UnauthorizedAccessException(
                "Only administrators can assign tickets.");
        }

        var ticket = await _dbContext.Tickets
            .FirstOrDefaultAsync(
                item => item.Id == ticketId);

        if (ticket is null)
        {
            return null;
        }

        var agent = await _userManager.FindByIdAsync(
            request.AgentId);

        if (agent is null)
        {
            throw new InvalidOperationException(
                "The specified support agent does not exist.");
        }

        var roles = await _userManager.GetRolesAsync(agent);

        if (!roles.Any(
                roleName =>
                    string.Equals(
                        roleName,
                        UserRole.SupportAgent.ToString(),
                        StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException(
                "The specified user does not have the SupportAgent role.");
        }

        ticket.AssignedAgentId = agent.Id;
        ticket.UpdatedAt = DateTime.UtcNow;

        _dbContext.Activities.Add(
            new Activity
            {
                TicketId = ticket.Id,
                UserId = userId,
                ActivityType = "Assigned",
                Description =
                    $"Ticket assigned to support agent " +
                    $"{agent.FirstName} {agent.LastName}.",
                CreatedAt = ticket.UpdatedAt
            });

        await _dbContext.SaveChangesAsync();

        return await BuildResponseAsync(ticket);
    }

    /// <inheritdoc />
    public async Task<TicketResponse?> UpdateStatusAsync(
        long ticketId,
        UpdateTicketStatusRequest request,
        string userId,
        string role)
    {
        EnsureAuthenticated(userId, role);

        var ticket = await _dbContext.Tickets
            .FirstOrDefaultAsync(
                item => item.Id == ticketId);

        if (ticket is null)
        {
            return null;
        }

        if (!IsAdmin(role) &&
            !IsSupportAgent(role))
        {
            throw new UnauthorizedAccessException(
                "Customers cannot change ticket status.");
        }

        if (IsSupportAgent(role) &&
            ticket.AssignedAgentId != userId)
        {
            throw new UnauthorizedAccessException(
                "You can only change the status of tickets assigned to you.");
        }

        var previousStatus = ticket.Status;

        ticket.Status = request.Status;
        ticket.UpdatedAt = DateTime.UtcNow;

        _dbContext.Activities.Add(
            new Activity
            {
                TicketId = ticket.Id,
                UserId = userId,
                ActivityType = "StatusChanged",
                Description =
                    $"Ticket status changed from " +
                    $"{previousStatus} to {request.Status}.",
                CreatedAt = ticket.UpdatedAt
            });

        await _dbContext.SaveChangesAsync();

        return await BuildResponseAsync(ticket);
    }

    /// <summary>
    /// Builds comments for a ticket.
    /// </summary>
    private async Task<List<Application.DTOs.Comments.CommentResponse>>
        BuildCommentsAsync(long ticketId)
    {
        var comments = await _dbContext.Comments
            .AsNoTracking()
            .Where(comment => comment.TicketId == ticketId)
            .OrderBy(comment => comment.CreatedAt)
            .ToListAsync();

        if (comments.Count == 0)
        {
            return new List<Application.DTOs.Comments.CommentResponse>();
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

                    return new Application.DTOs.Comments.CommentResponse
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

    /// <summary>
    /// Builds the activity timeline for a ticket.
    /// </summary>
    private async Task<List<Application.DTOs.Activities.ActivityResponse>>
        BuildActivitiesAsync(long ticketId)
    {
        var activities = await _dbContext.Activities
            .AsNoTracking()
            .Where(activity => activity.TicketId == ticketId)
            .OrderBy(activity => activity.CreatedAt)
            .ToListAsync();

        if (activities.Count == 0)
        {
            return new List<Application.DTOs.Activities.ActivityResponse>();
        }

        var userIds = activities
            .Select(activity => activity.UserId)
            .Distinct()
            .ToList();

        var users = await _dbContext.Users
            .AsNoTracking()
            .Where(user => userIds.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id);

        return activities
            .Select(
                activity =>
                {
                    users.TryGetValue(
                        activity.UserId,
                        out var user);

                    return new Application.DTOs.Activities.ActivityResponse
                    {
                        Id = activity.Id,
                        TicketId = activity.TicketId,
                        UserId = activity.UserId,
                        UserName = user is null
                            ? string.Empty
                            : BuildFullName(user),
                        ActivityType = activity.ActivityType,
                        Description = activity.Description,
                        CreatedAt = activity.CreatedAt
                    };
                })
            .ToList();
    }

    /// <summary>
    /// Builds time entries for a ticket.
    /// </summary>
    private async Task<List<Application.DTOs.TimeEntries.TimeEntryResponse>>
        BuildTimeEntriesAsync(long ticketId)
    {
        var entries = await _dbContext.TimeEntries
            .AsNoTracking()
            .Where(entry => entry.TicketId == ticketId)
            .OrderBy(entry => entry.WorkDate)
            .ThenBy(entry => entry.Id)
            .ToListAsync();

        if (entries.Count == 0)
        {
            return new List<Application.DTOs.TimeEntries.TimeEntryResponse>();
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

                    return new Application.DTOs.TimeEntries.TimeEntryResponse
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

    /// <summary>
    /// Applies sorting to the ticket query.
    /// </summary>
    private static IQueryable<Ticket> ApplySorting(
        IQueryable<Ticket> query,
        string? sortBy,
        bool descending)
    {
        return sortBy?.Trim().ToLowerInvariant() switch
        {
            "title" => descending
                ? query.OrderByDescending(ticket => ticket.Title)
                : query.OrderBy(ticket => ticket.Title),

            "priority" => descending
                ? query.OrderByDescending(ticket => ticket.Priority)
                : query.OrderBy(ticket => ticket.Priority),

            "status" => descending
                ? query.OrderByDescending(ticket => ticket.Status)
                : query.OrderBy(ticket => ticket.Status),

            "updatedat" => descending
                ? query.OrderByDescending(ticket => ticket.UpdatedAt)
                : query.OrderBy(ticket => ticket.UpdatedAt),

            "createdat" or _ => descending
                ? query.OrderByDescending(ticket => ticket.CreatedAt)
                : query.OrderBy(ticket => ticket.CreatedAt)
        };
    }

    /// <summary>
    /// Builds a ticket response.
    /// </summary>
    private async Task<TicketResponse> BuildResponseAsync(
        Ticket ticket)
    {
        var responses = await BuildResponsesAsync(
            new[] { ticket });

        return responses[0];
    }

    /// <summary>
    /// Builds ticket responses.
    /// </summary>
    private async Task<List<TicketResponse>> BuildResponsesAsync(
        IReadOnlyCollection<Ticket> tickets)
    {
        if (tickets.Count == 0)
        {
            return new List<TicketResponse>();
        }

        var userIds = tickets
            .SelectMany(
                ticket =>
                    new[]
                    {
                        ticket.CustomerId,
                        ticket.AssignedAgentId
                    })
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct()
            .ToList();

        var users = await _dbContext.Users
            .AsNoTracking()
            .Where(user => userIds.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id);

        var ticketIds = tickets
            .Select(ticket => ticket.Id)
            .ToList();

        var timeEntries = await _dbContext.TimeEntries
            .AsNoTracking()
            .Where(entry => ticketIds.Contains(entry.TicketId))
            .Select(
                entry => new
                {
                    entry.TicketId,
                    entry.Duration
                })
            .ToListAsync();

        var workTimes = timeEntries
            .GroupBy(entry => entry.TicketId)
            .ToDictionary(
                group => group.Key,
                group =>
                    group.Aggregate(
                        TimeSpan.Zero,
                        (total, entry) =>
                            total + entry.Duration));

        return tickets
            .Select(
                ticket =>
                {
                    users.TryGetValue(
                        ticket.CustomerId,
                        out var customer);

                    ApplicationUser? agent = null;

                    if (!string.IsNullOrWhiteSpace(
                            ticket.AssignedAgentId))
                    {
                        users.TryGetValue(
                            ticket.AssignedAgentId!,
                            out agent);
                    }

                    workTimes.TryGetValue(
                        ticket.Id,
                        out var totalWorkTime);

                    return new TicketResponse
                    {
                        Id = ticket.Id,
                        Title = ticket.Title,
                        Description = ticket.Description,
                        Status = ticket.Status,
                        Priority = ticket.Priority,
                        CustomerId = ticket.CustomerId,
                        CustomerName = customer is null
                            ? string.Empty
                            : BuildFullName(customer),
                        AssignedAgentId = ticket.AssignedAgentId,
                        AssignedAgentName = agent is null
                            ? null
                            : BuildFullName(agent),
                        CreatedAt = ticket.CreatedAt,
                        UpdatedAt = ticket.UpdatedAt,
                        TotalWorkTime = totalWorkTime
                    };
                })
            .ToList();
    }

    /// <summary>
    /// Ensures that the authenticated user is valid.
    /// </summary>
    private static void EnsureAuthenticated(
        string userId,
        string role)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException(
                "The authenticated user could not be identified.");
        }

        if (string.IsNullOrWhiteSpace(role))
        {
            throw new UnauthorizedAccessException(
                "The authenticated user's role could not be identified.");
        }
    }

    /// <summary>
    /// Ensures that a user can view a ticket.
    /// </summary>
    private static void EnsureCanView(
        Ticket ticket,
        string userId,
        string role)
    {
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
            "You are not authorized to view this ticket.");
    }

    /// <summary>
    /// Ensures that a user can modify a ticket.
    /// </summary>
    private static void EnsureCanModify(
        Ticket ticket,
        string userId,
        string role)
    {
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
            "You are not authorized to modify this ticket.");
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