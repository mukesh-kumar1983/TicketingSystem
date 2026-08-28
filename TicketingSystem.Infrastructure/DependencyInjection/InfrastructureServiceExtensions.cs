using System.Security.Cryptography;
using System.Text;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

using TicketingSystem.Application.Interfaces;
using TicketingSystem.Infrastructure.Authentication;
using TicketingSystem.Infrastructure.Identity;
using TicketingSystem.Infrastructure.Persistence;
using TicketingSystem.Infrastructure.Services;

namespace TicketingSystem.Infrastructure.DependencyInjection;

/// <summary>
/// Provides extension methods for registering Infrastructure services.
///
/// Infrastructure contains implementations for persistence, authentication,
/// ASP.NET Core Identity, application services that depend on Infrastructure,
/// and other external application concerns.
/// </summary>
public static class InfrastructureServiceExtensions
{
    /// <summary>
    /// Registers all Infrastructure services.
    /// </summary>
    /// <param name="services">
    /// The application's dependency injection service collection.
    /// </param>
    /// <param name="configuration">
    /// The application's configuration.
    /// </param>
    /// <returns>
    /// The updated service collection.
    /// </returns>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ---------------------------------------------------------------------
        // Database
        // ---------------------------------------------------------------------

        RegisterDatabase(
            services,
            configuration);

        // ---------------------------------------------------------------------
        // ASP.NET Core Identity
        // ---------------------------------------------------------------------

        RegisterIdentity(
            services);

        // ---------------------------------------------------------------------
        // JWT authentication
        // ---------------------------------------------------------------------

        RegisterJwtAuthentication(
            services,
            configuration);

        // ---------------------------------------------------------------------
        // Infrastructure implementations
        // ---------------------------------------------------------------------

        // Registers the JWT token generation service.
        services.AddScoped<
            IJwtTokenService,
            JwtTokenService>();

        // Registers the Identity application service.
        services.AddScoped<
            IIdentityService,
            IdentityService>();

        // Registers the application user-management service.
        //
        // UserService uses ASP.NET Core Identity to create, retrieve,
        // update and delete Customer and SupportAgent accounts.
        //
        // The UsersController depends on IUserService rather than directly
        // depending on UserService.
        services.AddScoped<
            IUserService,
            UserService>();

        // Registers the ticket application service.
        //
        // Controllers depend on ITicketService rather than directly depending
        // on TicketService. This keeps the API layer dependent on the
        // Application abstraction while Infrastructure supplies the concrete
        // implementation.
        services.AddScoped<
            ITicketService,
            TicketService>();


        // Registers the ticket comment application service.
        //
        // Controllers depend on ICommentService rather than directly depending
        // on CommentService. Infrastructure supplies the concrete implementation.
        services.AddScoped<
            ICommentService,
            CommentService>();

        // Registers the ticket comment application service.
        services.AddScoped<
            ICommentService,
            CommentService>();

        // Registers the ticket time-entry application service.
        services.AddScoped<
            ITimeEntryService,
            TimeEntryService>();

        return services;
    }

    /// <summary>
    /// Registers Entity Framework Core and SQL Server.
    /// </summary>
    /// <param name="services">
    /// The application's dependency injection service collection.
    /// </param>
    /// <param name="configuration">
    /// The application's configuration.
    /// </param>
    private static void RegisterDatabase(
        IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString(
                "DefaultConnection");

        if (string.IsNullOrWhiteSpace(
            connectionString))
        {
            throw new InvalidOperationException(
                "The 'DefaultConnection' connection string has not been configured.");
        }

        services.AddDbContext<TicketingSystemDbContext>(
            options =>
            {
                options.UseSqlServer(
                    connectionString);
            });
    }

    /// <summary>
    /// Registers ASP.NET Core Identity.
    /// </summary>
    /// <param name="services">
    /// The application's dependency injection service collection.
    /// </param>
    private static void RegisterIdentity(
        IServiceCollection services)
    {
        services.AddIdentityCore<ApplicationUser>(
            options =>
            {
                options.User.RequireUniqueEmail = true;

                options.Password.RequireDigit = true;

                options.Password.RequireLowercase = true;

                options.Password.RequireUppercase = true;

                options.Password.RequireNonAlphanumeric = false;

                options.Password.RequiredLength = 8;
            })
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<TicketingSystemDbContext>()
            .AddSignInManager();
    }

    /// <summary>
    /// Registers JWT bearer authentication.
    /// </summary>
    /// <param name="services">
    /// The application's dependency injection service collection.
    /// </param>
    /// <param name="configuration">
    /// The application's configuration.
    /// </param>
    private static void RegisterJwtAuthentication(
        IServiceCollection services,
        IConfiguration configuration)
    {
        // ---------------------------------------------------------------------
        // Read the JWT configuration.
        // ---------------------------------------------------------------------

        var jwtSection =
            configuration.GetSection(
                JwtOptions.SectionName);

        var jwtOptions =
            jwtSection.Get<JwtOptions>()
            ?? throw new InvalidOperationException(
                "JWT configuration has not been configured.");

        // ---------------------------------------------------------------------
        // Validate the JWT secret.
        // ---------------------------------------------------------------------

        if (string.IsNullOrWhiteSpace(
            jwtOptions.SecretKey))
        {
            throw new InvalidOperationException(
                "JWT SecretKey has not been configured.");
        }

        var secretKeyBytes =
            Encoding.UTF8.GetBytes(
                jwtOptions.SecretKey);

        if (secretKeyBytes.Length < 32)
        {
            throw new InvalidOperationException(
                "JWT SecretKey must contain at least 32 bytes.");
        }

        // ---------------------------------------------------------------------
        // Validate issuer.
        // ---------------------------------------------------------------------

        if (string.IsNullOrWhiteSpace(
            jwtOptions.Issuer))
        {
            throw new InvalidOperationException(
                "JWT Issuer has not been configured.");
        }

        // ---------------------------------------------------------------------
        // Validate audience.
        // ---------------------------------------------------------------------

        if (string.IsNullOrWhiteSpace(
            jwtOptions.Audience))
        {
            throw new InvalidOperationException(
                "JWT Audience has not been configured.");
        }

        // ---------------------------------------------------------------------
        // Register strongly typed JWT configuration.
        // ---------------------------------------------------------------------

        services.Configure<JwtOptions>(
            jwtSection);

        // ---------------------------------------------------------------------
        // Create the validation key.
        //
        // IMPORTANT:
        // This uses the exact same SecretKey and SigningKeyId used by
        // JwtTokenService.
        // ---------------------------------------------------------------------

        var validationKey =
            new SymmetricSecurityKey(
                secretKeyBytes)
            {
                KeyId =
                    JwtTokenService.SigningKeyId
            };

        // ---------------------------------------------------------------------
        // Generate a safe fingerprint of the validation key.
        //
        // The actual secret is never displayed.
        // ---------------------------------------------------------------------

        var validationKeyFingerprint =
            Convert.ToHexString(
                SHA256.HashData(
                    secretKeyBytes));

        Console.WriteLine(
            $"JWT Validation Key Fingerprint: " +
            $"{validationKeyFingerprint}");

        Console.WriteLine(
            $"JWT Validation Key Length: " +
            $"{secretKeyBytes.Length} bytes");

        Console.WriteLine(
            $"JWT Validation Key ID: " +
            $"{validationKey.KeyId}");

        Console.WriteLine(
            $"JWT Validation Issuer: " +
            $"{jwtOptions.Issuer}");

        Console.WriteLine(
            $"JWT Validation Audience: " +
            $"{jwtOptions.Audience}");

        // ---------------------------------------------------------------------
        // Register JWT bearer authentication.
        // ---------------------------------------------------------------------

        services.AddAuthentication(
            options =>
            {
                options.DefaultAuthenticateScheme =
                    JwtBearerDefaults.AuthenticationScheme;

                options.DefaultChallengeScheme =
                    JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(
                options =>
                {
                    // ---------------------------------------------------------
                    // Configure token validation.
                    // ---------------------------------------------------------

                    options.TokenValidationParameters =
                        new TokenValidationParameters
                        {
                            ValidateIssuerSigningKey = true,

                            IssuerSigningKey =
                                validationKey,

                            ValidateIssuer = true,

                            ValidIssuer =
                                jwtOptions.Issuer,

                            ValidateAudience = true,

                            ValidAudience =
                                jwtOptions.Audience,

                            ValidateLifetime = true,

                            ClockSkew =
                                TimeSpan.FromMinutes(1)
                        };

                    // ---------------------------------------------------------
                    // Development diagnostics.
                    // ---------------------------------------------------------

                    options.Events =
                        new JwtBearerEvents
                        {
                            OnMessageReceived =
                                context =>
                                {
                                    var authorizationHeader =
                                        context.Request
                                            .Headers
                                            .Authorization
                                            .ToString();

                                    Console.WriteLine(
                                        "JWT Authorization Header: " +
                                        $"{(string.IsNullOrWhiteSpace(
                                            authorizationHeader)
                                            ? "NOT PRESENT"
                                            : "PRESENT")}");

                                    return Task.CompletedTask;
                                },

                            OnAuthenticationFailed =
                                context =>
                                {
                                    Console.WriteLine(
                                        "JWT Authentication Failed:");

                                    Console.WriteLine(
                                        context.Exception);

                                    return Task.CompletedTask;
                                },

                            OnTokenValidated =
                                context =>
                                {
                                    Console.WriteLine(
                                        "JWT Token Successfully Validated.");

                                    return Task.CompletedTask;
                                },

                            OnChallenge =
                                context =>
                                {
                                    Console.WriteLine(
                                        $"JWT Challenge: " +
                                        $"Error={context.Error}, " +
                                        $"Description={context.ErrorDescription}");

                                    return Task.CompletedTask;
                                }
                        };
                });

        // ---------------------------------------------------------------------
        // Register authorization services.
        // ---------------------------------------------------------------------

        services.AddAuthorization();
    }
}