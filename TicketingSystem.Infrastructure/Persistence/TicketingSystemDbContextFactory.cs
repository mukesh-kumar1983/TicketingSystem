using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TicketingSystem.Infrastructure.Persistence;

/// <summary>
/// Creates <see cref="TicketingSystemDbContext"/> instances at design time
/// for Entity Framework Core migration operations.
/// </summary>
public sealed class TicketingSystemDbContextFactory
    : IDesignTimeDbContextFactory<TicketingSystemDbContext>
{
    /// <summary>
    /// Creates a configured database context for Entity Framework Core
    /// design-time operations such as creating and updating migrations.
    /// </summary>
    /// <param name="args">
    /// Command-line arguments supplied by the Entity Framework Core tools.
    /// </param>
    /// <returns>A configured database context.</returns>
    public TicketingSystemDbContext CreateDbContext(string[] args)
    {
        const string connectionString =
            "Server=(localdb)\\MSSQLLocalDB;" +
            "Database=TicketingSystemDb;" +
            "Trusted_Connection=True;" +
            "TrustServerCertificate=True;" +
            "MultipleActiveResultSets=True";

        var optionsBuilder =
            new DbContextOptionsBuilder<TicketingSystemDbContext>();

        optionsBuilder.UseSqlServer(connectionString);

        return new TicketingSystemDbContext(optionsBuilder.Options);
    }
}