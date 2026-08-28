using Microsoft.AspNetCore.Identity;
using TicketingSystem.Application.Interfaces;

namespace TicketingSystem.Infrastructure.Identity;

/// <summary>
/// Implements application user authentication and profile management
/// using ASP.NET Core Identity.
/// </summary>
public sealed class IdentityService : IIdentityService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;

    /// <summary>
    /// Initializes a new instance of the <see cref="IdentityService"/> class.
    /// </summary>
    /// <param name="userManager">
    /// The ASP.NET Core Identity user manager.
    /// </param>
    /// <param name="signInManager">
    /// The ASP.NET Core Identity sign-in manager.
    /// </param>
    public IdentityService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
    }

    /// <inheritdoc />
    public async Task<AuthenticatedUser?> AuthenticateAsync(
        string email,
        string password)
    {
        var user = await _userManager.FindByEmailAsync(email);

        if (user is null)
        {
            return null;
        }

        var result = await _signInManager.CheckPasswordSignInAsync(
            user,
            password,
            lockoutOnFailure: false);

        if (!result.Succeeded)
        {
            return null;
        }

        return await BuildAuthenticatedUserAsync(user);
    }

    /// <inheritdoc />
    public async Task<AuthenticatedUser?> UpdateUserAsync(
        string userId,
        string firstName,
        string lastName,
        string email)
    {
        /*
         * Locate the Identity user using the identifier contained
         * in the authenticated JWT.
         */
        var user = await _userManager.FindByIdAsync(userId);

        if (user is null)
        {
            return null;
        }

        /*
         * Normalize the incoming values before persisting them.
         */
        firstName = firstName.Trim();
        lastName = lastName.Trim();
        email = email.Trim();

        /*
         * Check whether another Identity user already owns the
         * requested email address.
         */
        var existingUser =
            await _userManager.FindByEmailAsync(email);

        if (existingUser is not null &&
            existingUser.Id != user.Id)
        {
            throw new InvalidOperationException(
                "The email address is already being used by another account.");
        }

        /*
         * Update the profile properties stored on ApplicationUser.
         */
        user.FirstName = firstName;
        user.LastName = lastName;

        /*
         * Update the email through UserManager so that ASP.NET Core
         * Identity also maintains EmailConfirmed and normalized email
         * information correctly.
         */
        if (!string.Equals(
                user.Email,
                email,
                StringComparison.OrdinalIgnoreCase))
        {
            var emailResult =
                await _userManager.SetEmailAsync(user, email);

            if (!emailResult.Succeeded)
            {
                throw new InvalidOperationException(
                    BuildIdentityErrorMessage(emailResult));
            }
        }

        /*
         * Persist the first and last name changes.
         */
        var updateResult =
            await _userManager.UpdateAsync(user);

        if (!updateResult.Succeeded)
        {
            throw new InvalidOperationException(
                BuildIdentityErrorMessage(updateResult));
        }

        /*
         * Reload the user's roles and construct the same authenticated
         * user model used by the login operation.
         */
        return await BuildAuthenticatedUserAsync(user);
    }

    /// <summary>
    /// Builds the application-level authenticated user model from
    /// an ASP.NET Core Identity user.
    /// </summary>
    /// <param name="user">The Identity user.</param>
    /// <returns>
    /// The application-level authenticated user, or null when the
    /// user does not have an assigned application role.
    /// </returns>
    private async Task<AuthenticatedUser?> BuildAuthenticatedUserAsync(
        ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);

        var role = roles.FirstOrDefault();

        if (string.IsNullOrWhiteSpace(role))
        {
            return null;
        }

        return new AuthenticatedUser
        {
            UserId = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = role
        };
    }

    /// <summary>
    /// Converts ASP.NET Core Identity errors into a single
    /// user-readable application exception message.
    /// </summary>
    /// <param name="result">Identity operation result.</param>
    /// <returns>A combined Identity error message.</returns>
    private static string BuildIdentityErrorMessage(
        IdentityResult result)
    {
        var messages = result.Errors
            .Select(error => error.Description)
            .Where(description => !string.IsNullOrWhiteSpace(description));

        return string.Join(" ", messages);
    }
}