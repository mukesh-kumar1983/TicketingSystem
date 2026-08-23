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

namespace TicketingSystem.Infrastructure.DependencyInjection;

/// <summary>
/// Provides extension methods for registering Infrastructure services.
/// 
/// This class is responsible for configuring infrastructure-related
/// dependencies such as:
/// 
/// - Entity Framework Core
/// - SQL Server
/// - ASP.NET Core Identity
/// - JWT authentication
/// - Application identity services
/// - JWT token services
/// 
/// The Infrastructure project contains implementation details that are
/// intentionally kept outside the Application and Domain layers.
/// </summary>
public static class InfrastructureServiceExtensions
{
    /// <summary>
    /// Gets the identifier assigned to the symmetric key used for signing
    /// and validating TicketingSystem JWT access tokens.
    /// 
    /// Both token generation and token validation must use the same key
    /// identifier. This is particularly important with newer versions of
    /// Microsoft.IdentityModel, which use the JWT <c>kid</c> header to
    /// identify the signing key.
    /// </summary>
    private const string JwtSigningKeyId = "TicketingSystemJwtKey";

    /// <summary>
    /// Registers persistence, Identity, authentication, and other
    /// Infrastructure services with the application's dependency
    /// injection container.
    /// </summary>
    /// <param name="services">
    /// The application's service collection.
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
        RegisterDatabase(
            services,
            configuration);

        RegisterIdentity(
            services);

        RegisterJwtAuthentication(
            services,
            configuration);

        services.AddScoped<IJwtTokenService, JwtTokenService>();

        services.AddScoped<IIdentityService, IdentityService>();

        return services;
    }

    /// <summary>
    /// Registers Entity Framework Core and configures SQL Server
    /// using the application's configured connection string.
    /// </summary>
    /// <param name="services">
    /// The application's service collection.
    /// </param>
    /// <param name="configuration">
    /// The application's configuration.
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the default database connection string has not
    /// been configured.
    /// </exception>
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
    /// Registers ASP.NET Core Identity and configures the application's
    /// password and user-account requirements.
    /// </summary>
    /// <param name="services">
    /// The application's service collection.
    /// </param>
    private static void RegisterIdentity(
        IServiceCollection services)
    {
        services.AddIdentityCore<ApplicationUser>(
            options =>
            {
                // Require every user to have a unique email address.
                options.User.RequireUniqueEmail = true;

                // Configure password requirements.
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
    /// Registers and configures JWT bearer authentication.
    /// 
    /// The same symmetric signing key is used by:
    /// 
    /// 1. <see cref="JwtTokenService"/> when generating JWT tokens.
    /// 2. ASP.NET Core JWT Bearer authentication when validating JWT tokens.
    /// 
    /// The signing key also has an explicit KeyId so that the generated JWT
    /// contains a <c>kid</c> header. This allows the Microsoft IdentityModel
    /// token validation pipeline to correctly identify the configured key.
    /// </summary>
    /// <param name="services">
    /// The application's service collection.
    /// </param>
    /// <param name="configuration">
    /// The application's configuration.
    /// </param>
    /// <exception cref="InvalidOperationException">
    /// Thrown when required JWT configuration is missing or invalid.
    /// </exception>
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
        // Validate the JWT configuration.
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

        if (string.IsNullOrWhiteSpace(
            jwtOptions.Issuer))
        {
            throw new InvalidOperationException(
                "JWT Issuer has not been configured.");
        }

        if (string.IsNullOrWhiteSpace(
            jwtOptions.Audience))
        {
            throw new InvalidOperationException(
                "JWT Audience has not been configured.");
        }

        // ---------------------------------------------------------------------
        // Register the strongly typed JWT configuration.
        // ---------------------------------------------------------------------

        services.Configure<JwtOptions>(
            jwtSection);

        // ---------------------------------------------------------------------
        // Create the symmetric signing/validation key.
        //
        // The explicit KeyId is important. Microsoft.IdentityModel can use
        // the JWT "kid" header to identify which signing key should be used
        // during signature validation.
        // ---------------------------------------------------------------------

        var signingKey =
            new SymmetricSecurityKey(
                secretKeyBytes)
            {
                KeyId = JwtSigningKeyId
            };

        // ---------------------------------------------------------------------
        // TEMPORARY DIAGNOSTIC INFORMATION
        // ---------------------------------------------------------------------
        //
        // We deliberately do NOT print the JWT secret.
        //
        // The SHA-256 fingerprint allows us to verify that the same secret
        // is being used without exposing the actual secret.
        //
        // These diagnostics can be removed once JWT authentication has been
        // completely verified.
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
            $"{JwtSigningKeyId}");

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
                // JWT Bearer is the default authentication mechanism for
                // incoming API requests.
                options.DefaultAuthenticateScheme =
                    JwtBearerDefaults.AuthenticationScheme;

                // JWT Bearer is also used when an unauthenticated request
                // needs to be challenged.
                options.DefaultChallengeScheme =
                    JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(
                options =>
                {
                    // ---------------------------------------------------------
                    // Configure JWT validation.
                    // ---------------------------------------------------------

                    options.TokenValidationParameters =
                        new TokenValidationParameters
                        {
                            // Ensure that the JWT signature is validated.
                            ValidateIssuerSigningKey = true,

                            // Use our explicitly identified symmetric key.
                            IssuerSigningKey = signingKey,

                            // Ensure that the token issuer is validated.
                            ValidateIssuer = true,

                            // The issuer must match the configured value.
                            ValidIssuer = jwtOptions.Issuer,

                            // Ensure that the token audience is validated.
                            ValidateAudience = true,

                            // The audience must match the configured value.
                            ValidAudience = jwtOptions.Audience,

                            // Reject expired JWT tokens.
                            ValidateLifetime = true,

                            // Allow a small amount of clock difference between
                            // the token issuer and API server.
                            ClockSkew = TimeSpan.FromMinutes(1)
                        };

                    // ---------------------------------------------------------
                    // JWT authentication diagnostics.
                    // ---------------------------------------------------------
                    //
                    // These events are useful while we are verifying the
                    // authentication pipeline. They can be removed after
                    // authentication is confirmed to be working.
                    // ---------------------------------------------------------

                    options.Events =
                        new JwtBearerEvents
                        {
                            /// <summary>
                            /// Executes when the JWT bearer handler receives
                            /// an incoming HTTP request.
                            /// </summary>
                            OnMessageReceived = context =>
                            {
                                var authorizationHeader =
                                    context.Request
                                        .Headers
                                        .Authorization
                                        .ToString();

                                Console.WriteLine(
                                    $"JWT Authorization Header: " +
                                    $"{(string.IsNullOrWhiteSpace(
                                        authorizationHeader)
                                        ? "NOT PRESENT"
                                        : "PRESENT")}");

                                return Task.CompletedTask;
                            },

                            /// <summary>
                            /// Executes when JWT authentication fails.
                            /// </summary>
                            OnAuthenticationFailed = context =>
                            {
                                Console.WriteLine(
                                    "JWT Authentication Failed:");

                                Console.WriteLine(
                                    context.Exception.ToString());

                                return Task.CompletedTask;
                            },

                            /// <summary>
                            /// Executes after the JWT has been successfully
                            /// validated.
                            /// </summary>
                            OnTokenValidated = context =>
                            {
                                Console.WriteLine(
                                    "JWT Token Successfully Validated.");

                                return Task.CompletedTask;
                            },

                            /// <summary>
                            /// Executes when the authentication handler
                            /// challenges an unauthenticated request.
                            /// </summary>
                            OnChallenge = context =>
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
        //
        // Authorization determines whether an authenticated user has
        // permission to access a particular endpoint or resource.
        // ---------------------------------------------------------------------

        services.AddAuthorization();
    }
}