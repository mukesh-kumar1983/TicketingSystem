using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TicketingSystem.Infrastructure.Identity;
using TicketingSystem.Infrastructure.Persistence;

namespace TicketingSystem.Infrastructure.Seeding;

/// <summary>
/// Creates the initial roles and test users required by the application.
/// </summary>
public static class IdentitySeeder
{
    private const string AdminRole = "Admin";
    private const string SupportAgentRole = "SupportAgent";
    private const string CustomerRole = "Customer";

    /// <summary>
    /// Seeds application roles and test users into the database.
    /// </summary>
    /// <param name="serviceProvider">
    /// The application's service provider.
    /// </param>
    public static async Task SeedAsync(
        IServiceProvider serviceProvider)
    {
        var context = serviceProvider
            .GetRequiredService<TicketingSystemDbContext>();

        var roleManager = serviceProvider
            .GetRequiredService<RoleManager<IdentityRole>>();

        var userManager = serviceProvider
            .GetRequiredService<UserManager<ApplicationUser>>();

        await context.Database.MigrateAsync();

        await SeedRoleAsync(roleManager, AdminRole);
        await SeedRoleAsync(roleManager, SupportAgentRole);
        await SeedRoleAsync(roleManager, CustomerRole);

        await SeedUserAsync(
            userManager,
            "admin@ticketingsystem.local",
            "Admin",
            "User",
            "Admin123!",
            AdminRole);

        await SeedUserAsync(
            userManager,
            "agent@ticketingsystem.local",
            "Support",
            "Agent",
            "Agent123!",
            SupportAgentRole);

        await SeedUserAsync(
            userManager,
            "customer@ticketingsystem.local",
            "Test",
            "Customer",
            "Customer123!",
            CustomerRole);
    }

    /// <summary>
    /// Creates a role when it does not already exist.
    /// </summary>
    /// <param name="roleManager">The Identity role manager.</param>
    /// <param name="roleName">The role name.</param>
    private static async Task SeedRoleAsync(
        RoleManager<IdentityRole> roleManager,
        string roleName)
    {
        if (await roleManager.RoleExistsAsync(roleName))
        {
            return;
        }

        var result = await roleManager.CreateAsync(
            new IdentityRole(roleName));

        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                $"Unable to create role '{roleName}': " +
                $"{string.Join(", ", result.Errors.Select(error => error.Description))}");
        }
    }

    /// <summary>
    /// Creates a test user and assigns the specified role.
    /// </summary>
    /// <param name="userManager">The Identity user manager.</param>
    /// <param name="email">The user's email address.</param>
    /// <param name="firstName">The user's first name.</param>
    /// <param name="lastName">The user's last name.</param>
    /// <param name="password">The user's initial password.</param>
    /// <param name="roleName">The user's role.</param>
    private static async Task SeedUserAsync(
        UserManager<ApplicationUser> userManager,
        string email,
        string firstName,
        string lastName,
        string password,
        string roleName)
    {
        var existingUser = await userManager.FindByEmailAsync(email);

        if (existingUser is not null)
        {
            return;
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FirstName = firstName,
            LastName = lastName
        };

        var createResult = await userManager.CreateAsync(
            user,
            password);

        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Unable to create user '{email}': " +
                $"{string.Join(", ", createResult.Errors.Select(error => error.Description))}");
        }

        var roleResult = await userManager.AddToRoleAsync(
            user,
            roleName);

        if (!roleResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Unable to assign role '{roleName}' to '{email}': " +
                $"{string.Join(", ", roleResult.Errors.Select(error => error.Description))}");
        }
    }
}