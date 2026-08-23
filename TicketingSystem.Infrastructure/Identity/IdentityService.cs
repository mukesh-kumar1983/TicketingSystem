using Microsoft.AspNetCore.Identity;
using TicketingSystem.Application.Interfaces;

namespace TicketingSystem.Infrastructure.Identity;

/// <summary>
/// Implements application user authentication using ASP.NET Core Identity.
/// </summary>
public sealed class IdentityService : IIdentityService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;

    /// <summary>
    /// Initializes a new instance of the <see cref="IdentityService"/> class.
    /// </summary>
    /// <param name="userManager">The ASP.NET Identity user manager.</param>
    /// <param name="signInManager">The ASP.NET Identity sign-in manager.</param>
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

        var roles = await _userManager.GetRolesAsync(user);

        var role = roles.FirstOrDefault();

        if (string.IsNullOrWhiteSpace(role))
        {
            return null;
        }

        return new AuthenticatedUser
        {
            UserId = user.Id,
            Email = user.Email ?? email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = role
        };
    }
}