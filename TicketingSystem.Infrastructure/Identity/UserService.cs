using Microsoft.AspNetCore.Identity;
using TicketingSystem.Application.DTOs.Users;
using TicketingSystem.Application.Interfaces;

namespace TicketingSystem.Infrastructure.Identity;

/// <summary>
/// Provides user-management operations using ASP.NET Core Identity.
///
/// This service is responsible for creating, retrieving, updating and
/// deleting application users.
///
/// Only Customer and SupportAgent accounts are managed through this service.
/// Administrator accounts are intentionally excluded from normal user
/// management operations.
/// </summary>
public sealed class UserService : IUserService
{
    private const string CustomerRole = "Customer";

    private const string SupportAgentRole = "SupportAgent";

    private readonly UserManager<ApplicationUser> _userManager;

    /// <summary>
    /// Initializes a new instance of the <see cref="UserService"/> class.
    /// </summary>
    /// <param name="userManager">
    /// ASP.NET Core Identity user manager.
    /// </param>
    public UserService(
        UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<UserResponse>> GetUsersAsync(
        string role)
    {
        ValidateManagedRole(role);

        var users = await _userManager
            .GetUsersInRoleAsync(role);

        return users
            .Select(MapToResponse)
            .OrderBy(user => user.LastName)
            .ThenBy(user => user.FirstName)
            .ToList();
    }

    /// <inheritdoc />
    public async Task<UserResponse?> GetUserAsync(
        string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);

        if (user is null)
        {
            return null;
        }

        var roles = await _userManager.GetRolesAsync(user);

        var role = roles.FirstOrDefault();

        if (string.IsNullOrWhiteSpace(role))
        {
            return null;
        }

        return MapToResponse(user, role);
    }

    /// <inheritdoc />
    public async Task<UserResponse> CreateUserAsync(
        CreateUserRequest request)
    {
        ValidateManagedRole(request.Role);

        if (string.IsNullOrWhiteSpace(request.FirstName))
        {
            throw new InvalidOperationException(
                "First name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.LastName))
        {
            throw new InvalidOperationException(
                "Last name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new InvalidOperationException(
                "Email address is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            throw new InvalidOperationException(
                "Password is required.");
        }

        var existingUser =
            await _userManager.FindByEmailAsync(request.Email);

        if (existingUser is not null)
        {
            throw new InvalidOperationException(
                "A user with this email address already exists.");
        }

        var user = new ApplicationUser
        {
            UserName = request.Email.Trim(),
            Email = request.Email.Trim(),
            EmailConfirmed = true,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim()
        };

        var createResult =
            await _userManager.CreateAsync(
                user,
                request.Password);

        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(
                FormatIdentityErrors(createResult));
        }

        var roleResult =
            await _userManager.AddToRoleAsync(
                user,
                request.Role);

        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);

            throw new InvalidOperationException(
                FormatIdentityErrors(roleResult));
        }

        return MapToResponse(
            user,
            request.Role);
    }

    /// <inheritdoc />
    public async Task<UserResponse> UpdateUserAsync(
        string userId,
        UpdateUserRequest request)
    {
        ValidateManagedRole(request.Role);

        var user =
            await _userManager.FindByIdAsync(userId);

        if (user is null)
        {
            throw new KeyNotFoundException(
                $"User '{userId}' was not found.");
        }

        var currentRoles =
            await _userManager.GetRolesAsync(user);

        // Prevent an administrator from modifying an administrator
        // through the Customer/SupportAgent management API.
        if (currentRoles.Contains("Admin"))
        {
            throw new InvalidOperationException(
                "Administrator accounts cannot be modified through this endpoint.");
        }

        var existingUser =
            await _userManager.FindByEmailAsync(
                request.Email.Trim());

        if (existingUser is not null &&
            existingUser.Id != user.Id)
        {
            throw new InvalidOperationException(
                "A user with this email address already exists.");
        }

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.Email = request.Email.Trim();
        user.UserName = request.Email.Trim();

        var updateResult =
            await _userManager.UpdateAsync(user);

        if (!updateResult.Succeeded)
        {
            throw new InvalidOperationException(
                FormatIdentityErrors(updateResult));
        }

        // Remove the user's existing managed roles.
        var managedRoles =
            currentRoles
                .Where(role =>
                    role == CustomerRole ||
                    role == SupportAgentRole)
                .ToList();

        if (managedRoles.Count > 0)
        {
            var removeRoleResult =
                await _userManager.RemoveFromRolesAsync(
                    user,
                    managedRoles);

            if (!removeRoleResult.Succeeded)
            {
                throw new InvalidOperationException(
                    FormatIdentityErrors(removeRoleResult));
            }
        }

        // Assign the newly selected role.
        var addRoleResult =
            await _userManager.AddToRoleAsync(
                user,
                request.Role);

        if (!addRoleResult.Succeeded)
        {
            throw new InvalidOperationException(
                FormatIdentityErrors(addRoleResult));
        }

        return MapToResponse(
            user,
            request.Role);
    }

    /// <inheritdoc />
    public async Task DeleteUserAsync(
        string userId)
    {
        var user =
            await _userManager.FindByIdAsync(userId);

        if (user is null)
        {
            throw new KeyNotFoundException(
                $"User '{userId}' was not found.");
        }

        var roles =
            await _userManager.GetRolesAsync(user);

        if (roles.Contains("Admin"))
        {
            throw new InvalidOperationException(
                "Administrator accounts cannot be deleted through this endpoint.");
        }

        var deleteResult =
            await _userManager.DeleteAsync(user);

        if (!deleteResult.Succeeded)
        {
            throw new InvalidOperationException(
                FormatIdentityErrors(deleteResult));
        }
    }

    /// <summary>
    /// Validates that the specified role can be managed through this service.
    /// </summary>
    /// <param name="role">The role to validate.</param>
    private static void ValidateManagedRole(
        string role)
    {
        if (string.Equals(
                role,
                CustomerRole,
                StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (string.Equals(
                role,
                SupportAgentRole,
                StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        throw new InvalidOperationException(
            "Only Customer and SupportAgent users can be managed.");
    }

    /// <summary>
    /// Converts an Identity user into an application response DTO.
    /// </summary>
    /// <param name="user">The Identity user.</param>
    /// <returns>The application user response.</returns>
    private static UserResponse MapToResponse(
        ApplicationUser user)
    {
        return MapToResponse(
            user,
            string.Empty);
    }

    /// <summary>
    /// Converts an Identity user into an application response DTO.
    /// </summary>
    /// <param name="user">The Identity user.</param>
    /// <param name="role">The user's application role.</param>
    /// <returns>The application user response.</returns>
    private static UserResponse MapToResponse(
        ApplicationUser user,
        string role)
    {
        return new UserResponse
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email ?? string.Empty,
            Role = role
        };
    }

    /// <summary>
    /// Formats ASP.NET Core Identity errors into a readable application
    /// exception message.
    /// </summary>
    /// <param name="result">The Identity operation result.</param>
    /// <returns>A combined error message.</returns>
    private static string FormatIdentityErrors(
        IdentityResult result)
    {
        return string.Join(
            "; ",
            result.Errors.Select(
                error => error.Description));
    }
}