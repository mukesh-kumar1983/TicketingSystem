using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TicketingSystem.Infrastructure.Identity;
using TicketingSystem.Infrastructure.Persistence;

namespace TicketingSystem.Infrastructure.Seeding;

/// <summary>
/// Creates the initial roles and test users required by the application.
///
/// The seeder is designed to be idempotent, which means it can safely run
/// every time the application starts without attempting to recreate existing
/// roles or users.
/// </summary>
public static class IdentitySeeder
{
    /// <summary>
    /// Name of the administrator role.
    /// </summary>
    private const string AdminRole = "Admin";

    /// <summary>
    /// Name of the support-agent role.
    /// </summary>
    private const string SupportAgentRole = "SupportAgent";

    /// <summary>
    /// Name of the customer role.
    /// </summary>
    private const string CustomerRole = "Customer";

    /// <summary>
    /// Seeds application roles and test users into the database.
    ///
    /// The database is migrated before the Identity data is seeded.
    /// Existing roles and users are reused rather than recreated.
    /// </summary>
    /// <param name="serviceProvider">
    /// The application's service provider.
    /// </param>
    /// <returns>
    /// A task representing the asynchronous seeding operation.
    /// </returns>
    public static async Task SeedAsync(
        IServiceProvider serviceProvider)
    {
        ArgumentNullException.ThrowIfNull(serviceProvider);

        var context = serviceProvider
            .GetRequiredService<TicketingSystemDbContext>();

        var roleManager = serviceProvider
            .GetRequiredService<RoleManager<IdentityRole>>();

        var userManager = serviceProvider
            .GetRequiredService<UserManager<ApplicationUser>>();

        /*
         * Apply any pending Entity Framework Core migrations before attempting
         * to access or create Identity records.
         */
        await context.Database.MigrateAsync();

        /*
         * Create the application roles when they do not already exist.
         */
        await SeedRoleAsync(roleManager, AdminRole);
        await SeedRoleAsync(roleManager, SupportAgentRole);
        await SeedRoleAsync(roleManager, CustomerRole);

        /*
         * Create or reuse the default administrator account.
         */
        await SeedUserAsync(
            userManager,
            "admin@ticketingsystem.local",
            "Admin",
            "User",
            "Admin123!",
            AdminRole);

        /*
         * Create or reuse the default support-agent account.
         */
        await SeedUserAsync(
            userManager,
            "agent@ticketingsystem.local",
            "Support",
            "Agent",
            "Agent123!",
            SupportAgentRole);

        /*
         * Create or reuse the default customer account.
         */
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
    /// <param name="roleManager">
    /// The ASP.NET Core Identity role manager.
    /// </param>
    /// <param name="roleName">
    /// The role name.
    /// </param>
    /// <returns>
    /// A task representing the asynchronous role-seeding operation.
    /// </returns>
    private static async Task SeedRoleAsync(
        RoleManager<IdentityRole> roleManager,
        string roleName)
    {
        /*
         * If the role already exists, there is nothing to create.
         */
        if (await roleManager.RoleExistsAsync(roleName))
        {
            return;
        }

        /*
         * Create the missing role.
         */
        var result = await roleManager.CreateAsync(
            new IdentityRole(roleName));

        /*
         * Identity may return multiple validation errors, so include all of
         * them in the exception to make startup failures easier to diagnose.
         */
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                $"Unable to create role '{roleName}': " +
                $"{string.Join(", ", result.Errors.Select(error => error.Description))}");
        }
    }

    /// <summary>
    /// Creates a test user when the user does not already exist and ensures
    /// that the existing or newly created user has the required role.
    ///
    /// The user is searched by both email and username. This is important
    /// because an existing Identity record can contain the requested username
    /// even when its email information does not match the expected value.
    /// </summary>
    /// <param name="userManager">
    /// The ASP.NET Core Identity user manager.
    /// </param>
    /// <param name="email">
    /// The user's email address and intended username.
    /// </param>
    /// <param name="firstName">
    /// The user's first name.
    /// </param>
    /// <param name="lastName">
    /// The user's last name.
    /// </param>
    /// <param name="password">
    /// The user's initial password when the account must be created.
    /// </param>
    /// <param name="roleName">
    /// The role that the user must belong to.
    /// </param>
    /// <returns>
    /// A task representing the asynchronous user-seeding operation.
    /// </returns>
    private static async Task SeedUserAsync(
        UserManager<ApplicationUser> userManager,
        string email,
        string firstName,
        string lastName,
        string password,
        string roleName)
    {
        /*
         * First search by email.
         *
         * This is the normal lookup for an Identity user whose email matches
         * the configured seed account.
         */
        var existingUser = await userManager.FindByEmailAsync(email);

        /*
         * If the email lookup did not find the user, search by username too.
         *
         * UserName is intentionally checked because the username has a
         * unique Identity constraint. Without this second lookup, the seeder
         * could attempt to create a user whose username already exists.
         */
        existingUser ??= await userManager.FindByNameAsync(email);

        /*
         * If the user already exists, do not attempt to create another user.
         *
         * Instead, make sure the existing user has the expected role.
         */
        if (existingUser is not null)
        {
            await EnsureUserRoleAsync(
                userManager,
                existingUser,
                roleName);

            return;
        }

        /*
         * No matching user exists, so create the initial Identity account.
         */
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FirstName = firstName,
            LastName = lastName
        };

        /*
         * Create the Identity user using the configured password hasher and
         * Identity validation pipeline.
         */
        var createResult = await userManager.CreateAsync(
            user,
            password);

        /*
         * Stop application startup when user creation fails.
         *
         * This is preferable to silently continuing with a partially seeded
         * system.
         */
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Unable to create user '{email}': " +
                $"{string.Join(", ", createResult.Errors.Select(error => error.Description))}");
        }

        /*
         * Assign the required application role to the newly created user.
         */
        await EnsureUserRoleAsync(
            userManager,
            user,
            roleName);
    }

    /// <summary>
    /// Ensures that an existing or newly created user belongs to the
    /// specified Identity role.
    /// </summary>
    /// <param name="userManager">
    /// The ASP.NET Core Identity user manager.
    /// </param>
    /// <param name="user">
    /// The Identity user.
    /// </param>
    /// <param name="roleName">
    /// The required application role.
    /// </param>
    /// <returns>
    /// A task representing the asynchronous role-assignment operation.
    /// </returns>
    private static async Task EnsureUserRoleAsync(
        UserManager<ApplicationUser> userManager,
        ApplicationUser user,
        string roleName)
    {
        /*
         * Do not add a role that the user already has.
         *
         * This makes repeated application startups safe.
         */
        if (await userManager.IsInRoleAsync(user, roleName))
        {
            return;
        }

        /*
         * The user exists but does not have the required role, so assign it.
         */
        var roleResult = await userManager.AddToRoleAsync(
            user,
            roleName);

        /*
         * Fail clearly if Identity could not assign the required role.
         */
        if (!roleResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Unable to assign role '{roleName}' to " +
                $"'{user.Email ?? user.UserName}': " +
                $"{string.Join(", ", roleResult.Errors.Select(error => error.Description))}");
        }
    }
}