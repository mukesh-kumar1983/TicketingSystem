using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TicketingSystem.Application.DTOs.Authentication;
using TicketingSystem.Application.Interfaces;

namespace TicketingSystem.Infrastructure.Authentication;

/// <summary>
/// Generates JWT access tokens for authenticated users.
///
/// This service is responsible only for creating JWT access tokens.
/// It does not authenticate users or validate incoming tokens.
/// User authentication is handled by the Application and Identity services,
/// while incoming JWT validation is configured in the Infrastructure
/// authentication configuration.
/// </summary>
public sealed class JwtTokenService : IJwtTokenService
{
    /// <summary>
    /// Identifies the symmetric signing key used by TicketingSystem JWT tokens.
    ///
    /// This value must match the KeyId configured in
    /// <see cref="TicketingSystem.Infrastructure.DependencyInjection.InfrastructureServiceExtensions"/>.
    ///
    /// The key identifier becomes the JWT "kid" header. Microsoft IdentityModel
    /// uses this identifier to determine which signing key should be used when
    /// validating the token.
    /// </summary>
    private const string JwtSigningKeyId = "TicketingSystemJwtKey";

    /// <summary>
    /// Contains the configured JWT settings.
    /// </summary>
    private readonly JwtOptions _jwtOptions;

    /// <summary>
    /// Initializes a new instance of the
    /// <see cref="JwtTokenService"/> class.
    /// </summary>
    /// <param name="options">
    /// The configured JWT options.
    /// </param>
    /// <exception cref="ArgumentNullException">
    /// Thrown when the JWT options are not provided.
    /// </exception>
    public JwtTokenService(
        IOptions<JwtOptions> options)
    {
        ArgumentNullException.ThrowIfNull(options);

        _jwtOptions = options.Value;
    }

    /// <inheritdoc />
    public LoginResponse GenerateToken(
        string userId,
        string email,
        string firstName,
        string lastName,
        string role)
    {
        // ---------------------------------------------------------------------
        // Calculate the token expiration time.
        //
        // JWT expiration is calculated using UTC to avoid problems caused by
        // different server time zones.
        // ---------------------------------------------------------------------

        var expiresAt =
            DateTime.UtcNow.AddMinutes(
                _jwtOptions.ExpirationMinutes);

        // ---------------------------------------------------------------------
        // Create the JWT claims.
        //
        // Claims represent information about the authenticated user.
        //
        // The role claim is particularly important because ASP.NET Core
        // authorization can use it for role-based authorization such as:
        //
        // [Authorize(Roles = "Admin")]
        //
        // The user identity claims are also used by endpoints such as
        // GET /api/Auth/me.
        // ---------------------------------------------------------------------

        var claims = new List<Claim>
        {
            // Standard JWT subject claim containing the user's identifier.
            new(
                JwtRegisteredClaimNames.Sub,
                userId),

            // Standard JWT email claim.
            new(
                JwtRegisteredClaimNames.Email,
                email),

            // ASP.NET Core identity identifier claim.
            new(
                ClaimTypes.NameIdentifier,
                userId),

            // ASP.NET Core email claim.
            new(
                ClaimTypes.Email,
                email),

            // User's first name.
            new(
                ClaimTypes.GivenName,
                firstName),

            // User's last name.
            new(
                ClaimTypes.Surname,
                lastName),

            // Full display name used by ASP.NET Core's User.Identity.Name.
            new(
                ClaimTypes.Name,
                $"{firstName} {lastName}".Trim()),

            // User's application role.
            new(
                ClaimTypes.Role,
                role)
        };

        // ---------------------------------------------------------------------
        // Convert the configured secret into bytes.
        //
        // The same secret must be used by the JWT validation configuration.
        // ---------------------------------------------------------------------

        var secretKeyBytes =
            Encoding.UTF8.GetBytes(
                _jwtOptions.SecretKey);

        // ---------------------------------------------------------------------
        // Create the symmetric signing key.
        //
        // The explicit KeyId is important for newer versions of
        // Microsoft.IdentityModel.
        //
        // It causes the generated JWT to contain:
        //
        // "kid": "TicketingSystemJwtKey"
        //
        // The validation side uses the exact same KeyId.
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
        // Instead, we calculate a SHA-256 fingerprint of the secret.
        // This allows us to compare the signing key with the validation key
        // without exposing the actual secret.
        //
        // These diagnostics can be removed after JWT authentication has been
        // completely verified.
        // ---------------------------------------------------------------------

        var keyFingerprint =
            Convert.ToHexString(
                SHA256.HashData(
                    secretKeyBytes));

        Console.WriteLine(
            $"JWT Signing Key Fingerprint: " +
            $"{keyFingerprint}");

        Console.WriteLine(
            $"JWT Signing Key Length: " +
            $"{secretKeyBytes.Length} bytes");

        Console.WriteLine(
            $"JWT Signing Key ID: " +
            $"{JwtSigningKeyId}");

        // ---------------------------------------------------------------------
        // Create signing credentials.
        //
        // HMAC SHA-256 is used to digitally sign the JWT.
        //
        // The receiving API will use the same symmetric secret to verify
        // that the token has not been modified.
        // ---------------------------------------------------------------------

        var credentials =
            new SigningCredentials(
                signingKey,
                SecurityAlgorithms.HmacSha256);

        // ---------------------------------------------------------------------
        // Create the JWT security token.
        //
        // The issuer, audience, claims, expiration, and signing credentials
        // are all included in the token.
        // ---------------------------------------------------------------------

        var token =
            new JwtSecurityToken(
                issuer: _jwtOptions.Issuer,
                audience: _jwtOptions.Audience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials);

        // ---------------------------------------------------------------------
        // Serialize the JWT into its compact string representation.
        //
        // This is the value that will be returned to the client and subsequently
        // sent in the HTTP Authorization header:
        //
        // Authorization: Bearer <access-token>
        // ---------------------------------------------------------------------

        var accessToken =
            new JwtSecurityTokenHandler()
                .WriteToken(token);

        // ---------------------------------------------------------------------
        // Return the authentication response.
        //
        // The response contains both the JWT and useful information about
        // the authenticated user.
        // ---------------------------------------------------------------------

        return new LoginResponse
        {
            AccessToken = accessToken,

            UserId = userId,

            FirstName = firstName,

            LastName = lastName,

            Email = email,

            Role = role,

            ExpiresAt = expiresAt
        };
    }
}