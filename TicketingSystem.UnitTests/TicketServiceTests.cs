using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Moq;
using TicketingSystem.Application.DTOs.Tickets;
using TicketingSystem.Application.Interfaces;
using TicketingSystem.Domain.Entities;
using TicketingSystem.Domain.Enums;
using TicketingSystem.Infrastructure.Identity;
using TicketingSystem.Infrastructure.Persistence;
using TicketingSystem.Infrastructure.Services;

namespace TicketingSystem.UnitTests;

/// <summary>
/// Contains unit tests for the <see cref="TicketService"/> class.
///
/// These tests focus on the most important business and authorization rules
/// required by the Support Ticket Management System assessment:
///
/// - Ticket creation.
/// - Customer data isolation.
/// - Support-agent data isolation.
/// - Administrator access.
/// - Ticket modification authorization.
/// - Ticket assignment authorization.
/// - Ticket status authorization.
/// - Ticket filtering and pagination.
/// - Activity creation.
/// - Total work-time calculation.
/// </summary>
public sealed class TicketServiceTests
{
    /// <summary>
    /// Creates a fresh in-memory database context for an individual test.
    ///
    /// A unique database name is used for every test so that test data
    /// cannot leak between test cases.
    /// </summary>
    /// <returns>A configured in-memory database context.</returns>
    private static TicketingSystemDbContext CreateDbContext()
    {
        var options =
            new DbContextOptionsBuilder<TicketingSystemDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

        return new TicketingSystemDbContext(options);
    }

    /// <summary>
    /// Creates a mocked ASP.NET Core Identity user manager.
    ///
    /// TicketService only needs the user manager for ticket assignment,
    /// therefore a lightweight mock is sufficient for these unit tests.
    /// </summary>
    /// <returns>A mocked user manager.</returns>
    private static Mock<UserManager<ApplicationUser>> CreateUserManagerMock()
    {
        var userStore =
            new Mock<IUserStore<ApplicationUser>>();

        return new Mock<UserManager<ApplicationUser>>(
            userStore.Object,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!);
    }

    /// <summary>
    /// Creates the ticket service used by a test.
    /// </summary>
    /// <param name="context">The test database context.</param>
    /// <param name="userManager">
    /// The mocked ASP.NET Core Identity user manager.
    /// </param>
    /// <returns>A configured ticket service.</returns>
    private static TicketService CreateService(
        TicketingSystemDbContext context,
        Mock<UserManager<ApplicationUser>> userManager)
    {
        return new TicketService(
            context,
            userManager.Object);
    }

    /// <summary>
    /// Adds a user to the test database.
    /// </summary>
    private static ApplicationUser AddUser(
        TicketingSystemDbContext context,
        string id,
        string email,
        string firstName,
        string lastName)
    {
        var user = new ApplicationUser
        {
            Id = id,
            UserName = email,
            Email = email,
            FirstName = firstName,
            LastName = lastName
        };

        context.Users.Add(user);

        context.SaveChanges();

        return user;
    }

    /// <summary>
    /// Creates a ticket directly in the test database.
    /// </summary>
    private static Ticket AddTicket(
        TicketingSystemDbContext context,
        long id,
        string customerId,
        string? assignedAgentId = null,
        string title = "Test Ticket",
        TicketStatus status = TicketStatus.Open,
        TicketPriority priority = TicketPriority.Medium)
    {
        var ticket = new Ticket
        {
            Id = id,
            CustomerId = customerId,
            AssignedAgentId = assignedAgentId,
            Title = title,
            Description = "Test ticket description.",
            Status = status,
            Priority = priority,
            CreatedAt = DateTime.UtcNow.AddMinutes(-10),
            UpdatedAt = DateTime.UtcNow
        };

        context.Tickets.Add(ticket);

        context.SaveChanges();

        return ticket;
    }

    /// <summary>
    /// Verifies that a customer can create a ticket and that the ticket
    /// is automatically assigned to the authenticated customer.
    /// </summary>
    [Fact]
    public async Task CreateAsync_Customer_CreatesTicketForAuthenticatedCustomer()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        var userManager = CreateUserManagerMock();

        var service = CreateService(
            context,
            userManager);

        var request = new CreateTicketRequest
        {
            Title = "  Cannot login  ",
            Description = "  Customer cannot log in.  ",
            Priority = TicketPriority.High
        };

        var result = await service.CreateAsync(
            request,
            "customer-1",
            "Customer");

        Assert.NotNull(result);
        Assert.True(result.Id > 0);
        Assert.Equal("Cannot login", result.Title);
        Assert.Equal(
            "Customer cannot log in.",
            result.Description);
        Assert.Equal(
            TicketPriority.High,
            result.Priority);
        Assert.Equal(
            TicketStatus.Open,
            result.Status);
        Assert.Equal(
            "customer-1",
            result.CustomerId);

        var activity =
            await context.Activities.SingleAsync();

        Assert.Equal(result.Id, activity.TicketId);
        Assert.Equal("customer-1", activity.UserId);
        Assert.Equal("Created", activity.ActivityType);
    }

    /// <summary>
    /// Verifies the mandatory customer data-isolation rule.
    ///
    /// A customer must not be able to retrieve another customer's ticket
    /// by manipulating the ticket identifier in the API request.
    /// </summary>
    [Fact]
    public async Task GetByIdAsync_CustomerCannotViewAnotherCustomersTicket()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        AddUser(
            context,
            "customer-2",
            "customer2@test.com",
            "Jane",
            "Customer");

        AddTicket(
            context,
            1001,
            "customer-2");

        var service = CreateService(
            context,
            CreateUserManagerMock());

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.GetByIdAsync(
                1001,
                "customer-1",
                "Customer"));
    }

    /// <summary>
    /// Verifies that a customer can retrieve their own ticket.
    /// </summary>
    [Fact]
    public async Task GetByIdAsync_CustomerCanViewOwnTicket()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        AddTicket(
            context,
            1001,
            "customer-1");

        var service = CreateService(
            context,
            CreateUserManagerMock());

        var result = await service.GetByIdAsync(
            1001,
            "customer-1",
            "Customer");

        Assert.NotNull(result);
        Assert.Equal(1001, result.Id);
        Assert.Equal(
            "customer-1",
            result.CustomerId);
    }

    /// <summary>
    /// Verifies that a support agent can only access tickets assigned
    /// to that agent.
    /// </summary>
    [Fact]
    public async Task GetByIdAsync_SupportAgentCannotViewUnassignedTicket()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        AddUser(
            context,
            "agent-1",
            "agent1@test.com",
            "Support",
            "Agent");

        AddUser(
            context,
            "agent-2",
            "agent2@test.com",
            "Other",
            "Agent");

        AddTicket(
            context,
            1001,
            "customer-1",
            "agent-2");

        var service = CreateService(
            context,
            CreateUserManagerMock());

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.GetByIdAsync(
                1001,
                "agent-1",
                "SupportAgent"));
    }

    /// <summary>
    /// Verifies that an administrator can view tickets regardless
    /// of their customer or assigned agent.
    /// </summary>
    [Fact]
    public async Task GetByIdAsync_AdminCanViewAnyTicket()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        AddTicket(
            context,
            1001,
            "customer-1");

        var service = CreateService(
            context,
            CreateUserManagerMock());

        var result = await service.GetByIdAsync(
            1001,
            "admin-1",
            "Admin");

        Assert.NotNull(result);
        Assert.Equal(1001, result.Id);
    }

    /// <summary>
    /// Verifies that the GetAll operation applies customer isolation.
    ///
    /// Even when multiple tickets exist in the database, a customer
    /// must only receive their own tickets.
    /// </summary>
    [Fact]
    public async Task GetAllAsync_CustomerReceivesOnlyOwnTickets()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        AddUser(
            context,
            "customer-2",
            "customer2@test.com",
            "Jane",
            "Customer");

        AddTicket(
            context,
            1001,
            "customer-1",
            title: "Customer One Ticket");

        AddTicket(
            context,
            1002,
            "customer-2",
            title: "Customer Two Ticket");

        AddTicket(
            context,
            1003,
            "customer-1",
            title: "Customer One Second Ticket");

        var service = CreateService(
            context,
            CreateUserManagerMock());

        var result = await service.GetAllAsync(
            new TicketQueryRequest
            {
                PageNumber = 1,
                PageSize = 100
            },
            "customer-1",
            "Customer");

        Assert.Equal(2, result.TotalCount);
        Assert.Equal(2, result.Items.Count);

        Assert.All(
            result.Items,
            ticket =>
                Assert.Equal(
                    "customer-1",
                    ticket.CustomerId));
    }

    /// <summary>
    /// Verifies that support agents only receive tickets assigned
    /// to themselves.
    /// </summary>
    [Fact]
    public async Task GetAllAsync_SupportAgentReceivesOnlyAssignedTickets()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        AddUser(
            context,
            "customer-2",
            "customer2@test.com",
            "Jane",
            "Customer");

        AddUser(
            context,
            "agent-1",
            "agent1@test.com",
            "Support",
            "Agent");

        AddUser(
            context,
            "agent-2",
            "agent2@test.com",
            "Other",
            "Agent");

        AddTicket(
            context,
            1001,
            "customer-1",
            "agent-1");

        AddTicket(
            context,
            1002,
            "customer-2",
            "agent-2");

        AddTicket(
            context,
            1003,
            "customer-1",
            "agent-1");

        var service = CreateService(
            context,
            CreateUserManagerMock());

        var result = await service.GetAllAsync(
            new TicketQueryRequest
            {
                PageNumber = 1,
                PageSize = 100
            },
            "agent-1",
            "SupportAgent");

        Assert.Equal(2, result.TotalCount);
        Assert.Equal(2, result.Items.Count);

        Assert.All(
            result.Items,
            ticket =>
                Assert.Equal(
                    "agent-1",
                    ticket.AssignedAgentId));
    }

    /// <summary>
    /// Verifies that ticket filtering and pagination work together.
    /// </summary>
    [Fact]
    public async Task GetAllAsync_AppliesFilteringAndPagination()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        AddTicket(
            context,
            1001,
            "customer-1",
            title: "Printer issue",
            priority: TicketPriority.High);

        AddTicket(
            context,
            1002,
            "customer-1",
            title: "Email issue",
            priority: TicketPriority.Low);

        AddTicket(
            context,
            1003,
            "customer-1",
            title: "Critical printer issue",
            priority: TicketPriority.Critical);

        var service = CreateService(
            context,
            CreateUserManagerMock());

        var result = await service.GetAllAsync(
            new TicketQueryRequest
            {
                PageNumber = 1,
                PageSize = 1,
                Search = "printer",
                Priority = TicketPriority.Critical
            },
            "customer-1",
            "Customer");

        Assert.Equal(1, result.TotalCount);
        Assert.Single(result.Items);
        Assert.Equal(
            1003,
            result.Items[0].Id);
    }

    /// <summary>
    /// Verifies that customers cannot change ticket status.
    /// </summary>
    [Fact]
    public async Task UpdateStatusAsync_CustomerCannotChangeStatus()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        AddTicket(
            context,
            1001,
            "customer-1");

        var service = CreateService(
            context,
            CreateUserManagerMock());

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.UpdateStatusAsync(
                1001,
                new UpdateTicketStatusRequest
                {
                    Status = TicketStatus.InProgress
                },
                "customer-1",
                "Customer"));
    }

    /// <summary>
    /// Verifies that an assigned support agent can change
    /// the status of their ticket.
    /// </summary>
    [Fact]
    public async Task UpdateStatusAsync_AssignedAgentCanChangeStatus()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        AddUser(
            context,
            "agent-1",
            "agent1@test.com",
            "Support",
            "Agent");

        AddTicket(
            context,
            1001,
            "customer-1",
            "agent-1",
            status: TicketStatus.Open);

        var service = CreateService(
            context,
            CreateUserManagerMock());

        var result = await service.UpdateStatusAsync(
            1001,
            new UpdateTicketStatusRequest
            {
                Status = TicketStatus.InProgress
            },
            "agent-1",
            "SupportAgent");

        Assert.NotNull(result);
        Assert.Equal(
            TicketStatus.InProgress,
            result.Status);

        var activity =
            await context.Activities.SingleAsync();

        Assert.Equal(
            "StatusChanged",
            activity.ActivityType);

        Assert.Contains(
            "Open",
            activity.Description);

        Assert.Contains(
            "InProgress",
            activity.Description);
    }

    /// <summary>
    /// Verifies that a support agent cannot change the status
    /// of another agent's ticket.
    /// </summary>
    [Fact]
    public async Task UpdateStatusAsync_WrongAgentCannotChangeStatus()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        AddUser(
            context,
            "agent-1",
            "agent1@test.com",
            "Support",
            "Agent");

        AddUser(
            context,
            "agent-2",
            "agent2@test.com",
            "Other",
            "Agent");

        AddTicket(
            context,
            1001,
            "customer-1",
            "agent-2");

        var service = CreateService(
            context,
            CreateUserManagerMock());

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.UpdateStatusAsync(
                1001,
                new UpdateTicketStatusRequest
                {
                    Status = TicketStatus.Resolved
                },
                "agent-1",
                "SupportAgent"));
    }

    /// <summary>
    /// Verifies that only administrators can assign tickets.
    /// </summary>
    [Fact]
    public async Task AssignAsync_NonAdminCannotAssignTicket()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        AddUser(
            context,
            "agent-1",
            "agent1@test.com",
            "Support",
            "Agent");

        AddTicket(
            context,
            1001,
            "customer-1");

        var userManager = CreateUserManagerMock();

        var service = CreateService(
            context,
            userManager);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.AssignAsync(
                1001,
                new AssignTicketRequest
                {
                    AgentId = "agent-1"
                },
                "agent-1",
                "SupportAgent"));
    }

    /// <summary>
    /// Verifies that an administrator can assign a ticket to
    /// a valid support agent.
    /// </summary>
    [Fact]
    public async Task AssignAsync_AdminCanAssignTicketToSupportAgent()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        var agent =
            AddUser(
                context,
                "agent-1",
                "agent1@test.com",
                "Support",
                "Agent");

        AddTicket(
            context,
            1001,
            "customer-1");

        var userManager = CreateUserManagerMock();

        userManager
            .Setup(manager =>
                manager.FindByIdAsync("agent-1"))
            .ReturnsAsync(agent);

        userManager
            .Setup(manager =>
                manager.GetRolesAsync(agent))
            .ReturnsAsync(
                new List<string>
                {
                    "SupportAgent"
                });

        var service = CreateService(
            context,
            userManager);

        var result = await service.AssignAsync(
            1001,
            new AssignTicketRequest
            {
                AgentId = "agent-1"
            },
            "admin-1",
            "Admin");

        Assert.NotNull(result);
        Assert.Equal(
            "agent-1",
            result.AssignedAgentId);

        var activity =
            await context.Activities.SingleAsync();

        Assert.Equal(
            "Assigned",
            activity.ActivityType);

        Assert.Contains(
            "Support Agent",
            activity.Description);
    }

    /// <summary>
    /// Verifies that an administrator cannot assign a ticket to
    /// a user who does not have the SupportAgent role.
    /// </summary>
    [Fact]
    public async Task AssignAsync_AdminCannotAssignToNonAgentUser()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        var customer =
            AddUser(
                context,
                "customer-2",
                "customer2@test.com",
                "Jane",
                "Customer");

        AddTicket(
            context,
            1001,
            "customer-1");

        var userManager = CreateUserManagerMock();

        userManager
            .Setup(manager =>
                manager.FindByIdAsync("customer-2"))
            .ReturnsAsync(customer);

        userManager
            .Setup(manager =>
                manager.GetRolesAsync(customer))
            .ReturnsAsync(
                new List<string>
                {
                    "Customer"
                });

        var service = CreateService(
            context,
            userManager);

        var exception =
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => service.AssignAsync(
                    1001,
                    new AssignTicketRequest
                    {
                        AgentId = "customer-2"
                    },
                    "admin-1",
                    "Admin"));

        Assert.Contains(
            "SupportAgent role",
            exception.Message);
    }

    /// <summary>
    /// Verifies that total work time is calculated from all time entries
    /// belonging to the ticket.
    /// </summary>
    [Fact]
    public async Task GetDetailsAsync_CalculatesTotalWorkTime()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        AddUser(
            context,
            "agent-1",
            "agent1@test.com",
            "Support",
            "Agent");

        AddTicket(
            context,
            1001,
            "customer-1",
            "agent-1");

        context.TimeEntries.AddRange(
            new TimeEntry
            {
                TicketId = 1001,
                UserId = "agent-1",
                WorkDate = DateTime.UtcNow.Date,
                Duration = TimeSpan.FromHours(1),
                Description = "Investigation"
            },
            new TimeEntry
            {
                TicketId = 1001,
                UserId = "agent-1",
                WorkDate = DateTime.UtcNow.Date,
                Duration = TimeSpan.FromMinutes(30),
                Description = "Fix"
            });

        context.SaveChanges();

        var service = CreateService(
            context,
            CreateUserManagerMock());

        var result = await service.GetDetailsAsync(
            1001,
            "customer-1",
            "Customer");

        Assert.NotNull(result);

        Assert.Equal(
            TimeSpan.FromMinutes(90),
            result.Ticket.TotalWorkTime);

        Assert.Equal(
            2,
            result.TimeEntries.Count);
    }

    /// <summary>
    /// Verifies that ticket details include the comments and activity
    /// timeline associated with the ticket.
    /// </summary>
    [Fact]
    public async Task GetDetailsAsync_ReturnsCommentsActivitiesAndTimeEntries()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        AddTicket(
            context,
            1001,
            "customer-1");

        context.Comments.Add(
            new Comment
            {
                TicketId = 1001,
                UserId = "customer-1",
                Content = "Additional information.",
                CreatedAt = DateTime.UtcNow
            });

        context.Activities.Add(
            new Activity
            {
                TicketId = 1001,
                UserId = "customer-1",
                ActivityType = "Created",
                Description = "Ticket created.",
                CreatedAt = DateTime.UtcNow
            });

        context.TimeEntries.Add(
            new TimeEntry
            {
                TicketId = 1001,
                UserId = "customer-1",
                WorkDate = DateTime.UtcNow.Date,
                Duration = TimeSpan.FromMinutes(15),
                Description = "Initial investigation."
            });

        context.SaveChanges();

        var service = CreateService(
            context,
            CreateUserManagerMock());

        var result = await service.GetDetailsAsync(
            1001,
            "customer-1",
            "Customer");

        Assert.NotNull(result);

        Assert.Single(result.Comments);
        Assert.Single(result.Activities);
        Assert.Single(result.TimeEntries);

        Assert.Equal(
            "Additional information.",
            result.Comments[0].Content);

        Assert.Equal(
            "Created",
            result.Activities[0].ActivityType);

        Assert.Equal(
            TimeSpan.FromMinutes(15),
            result.TimeEntries[0].Duration);
    }

    /// <summary>
    /// Verifies that a customer can update their own ticket.
    /// </summary>
    [Fact]
    public async Task UpdateAsync_CustomerCanUpdateOwnTicket()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        AddTicket(
            context,
            1001,
            "customer-1");

        var service = CreateService(
            context,
            CreateUserManagerMock());

        var result = await service.UpdateAsync(
            1001,
            new UpdateTicketRequest
            {
                Title = "Updated title",
                Description = "Updated description.",
                Priority = TicketPriority.High
            },
            "customer-1",
            "Customer");

        Assert.NotNull(result);
        Assert.Equal(
            "Updated title",
            result.Title);

        Assert.Equal(
            "Updated description.",
            result.Description);

        Assert.Equal(
            TicketPriority.High,
            result.Priority);

        var activity =
            await context.Activities.SingleAsync();

        Assert.Equal(
            "Updated",
            activity.ActivityType);
    }

    /// <summary>
    /// Verifies that a customer cannot update another customer's ticket.
    /// </summary>
    [Fact]
    public async Task UpdateAsync_CustomerCannotUpdateAnotherCustomersTicket()
    {
        await using var context = CreateDbContext();

        AddUser(
            context,
            "customer-1",
            "customer1@test.com",
            "John",
            "Customer");

        AddUser(
            context,
            "customer-2",
            "customer2@test.com",
            "Jane",
            "Customer");

        AddTicket(
            context,
            1001,
            "customer-2");

        var service = CreateService(
            context,
            CreateUserManagerMock());

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.UpdateAsync(
                1001,
                new UpdateTicketRequest
                {
                    Title = "Unauthorized update",
                    Description = "This should not be allowed.",
                    Priority = TicketPriority.Critical
                },
                "customer-1",
                "Customer"));
    }
}