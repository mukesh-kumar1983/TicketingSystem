using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TicketingSystem.Domain.Entities;
using TicketingSystem.Infrastructure.Identity;

namespace TicketingSystem.Infrastructure.Persistence;

/// <summary>
/// Represents the Entity Framework Core database context for the ticketing system.
/// </summary>
public sealed class TicketingSystemDbContext
    : IdentityDbContext<ApplicationUser>
{
    /// <summary>
    /// Initializes a new instance of the <see cref="TicketingSystemDbContext"/> class.
    /// </summary>
    /// <param name="options">The database context configuration options.</param>
    public TicketingSystemDbContext(
        DbContextOptions<TicketingSystemDbContext> options)
        : base(options)
    {
    }

    /// <summary>
    /// Gets or sets the support tickets.
    /// </summary>
    public DbSet<Ticket> Tickets => Set<Ticket>();

    /// <summary>
    /// Gets or sets the ticket comments.
    /// </summary>
    public DbSet<Comment> Comments => Set<Comment>();

    /// <summary>
    /// Gets or sets the ticket activities.
    /// </summary>
    public DbSet<Activity> Activities => Set<Activity>();

    /// <summary>
    /// Gets or sets the ticket time entries.
    /// </summary>
    public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();

    /// <summary>
    /// Configures the database model.
    /// </summary>
    /// <param name="builder">The model builder used to configure the database model.</param>
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        ConfigureTicket(builder);
        ConfigureComment(builder);
        ConfigureActivity(builder);
        ConfigureTimeEntry(builder);
    }

    /// <summary>
    /// Configures the ticket entity.
    /// </summary>
    /// <param name="builder">The model builder.</param>
    private static void ConfigureTicket(ModelBuilder builder)
    {
        builder.Entity<Ticket>(entity =>
        {
            entity.HasKey(ticket => ticket.Id);

            entity.Property(ticket => ticket.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(ticket => ticket.Description)
                .HasMaxLength(5000)
                .IsRequired();

            entity.Property(ticket => ticket.Status)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(ticket => ticket.Priority)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(ticket => ticket.CustomerId)
                .HasMaxLength(450)
                .IsRequired();

            entity.Property(ticket => ticket.AssignedAgentId)
                .HasMaxLength(450);
        });
    }

    /// <summary>
    /// Configures the comment entity.
    /// </summary>
    /// <param name="builder">The model builder.</param>
    private static void ConfigureComment(ModelBuilder builder)
    {
        builder.Entity<Comment>(entity =>
        {
            entity.HasKey(comment => comment.Id);

            entity.Property(comment => comment.UserId)
                .HasMaxLength(450)
                .IsRequired();

            entity.Property(comment => comment.Content)
                .HasMaxLength(5000)
                .IsRequired();
        });
    }

    /// <summary>
    /// Configures the activity entity.
    /// </summary>
    /// <param name="builder">The model builder.</param>
    private static void ConfigureActivity(ModelBuilder builder)
    {
        builder.Entity<Activity>(entity =>
        {
            entity.HasKey(activity => activity.Id);

            entity.Property(activity => activity.UserId)
                .HasMaxLength(450)
                .IsRequired();

            entity.Property(activity => activity.ActivityType)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(activity => activity.Description)
                .HasMaxLength(1000)
                .IsRequired();
        });
    }

    /// <summary>
    /// Configures the time-entry entity.
    /// </summary>
    /// <param name="builder">The model builder.</param>
    private static void ConfigureTimeEntry(ModelBuilder builder)
    {
        builder.Entity<TimeEntry>(entity =>
        {
            entity.HasKey(timeEntry => timeEntry.Id);

            entity.Property(timeEntry => timeEntry.UserId)
                .HasMaxLength(450)
                .IsRequired();

            entity.Property(timeEntry => timeEntry.Description)
                .HasMaxLength(2000)
                .IsRequired();
        });
    }
}