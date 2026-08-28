using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

using TicketingSystem.Application.DTOs.Authentication;
using TicketingSystem.Application.Interfaces;

namespace TicketingSystem.Infrastructure.Authentication;

/// <summary>
/// Generates JWT access tokens for authenticated users.
///
/// This service is responsible only for creating signed JWT access tokens.
/// Incoming JWT validation is handled separately by ASP.NET Core JWT Bearer
/// authentication configured by the Infrastructure layer.
///
/// The same JWT secret, issuer, audience, signing algorithm, and key identifier
/// used here must correspond to the values configured by the JWT Bearer
/// authentication configuration.
/// </summary>
public sealed class JwtTokenService : IJwtTokenService
{
    /// <summary>
    /// Identifies the symmetric signing key used by the TicketingSystem JWT
    /// authentication system.
    ///
    /// This value is written to the JWT "kid" header and is also configured
    /// on the validation key used by JWT Bearer authentication.
    /// </summary>
    public const string SigningKeyId = "TicketingSystemJwtKey";

    /// <summary>
    /// Contains the application's configured JWT settings.
    /// </summary>
    private readonly JwtOptions _jwtOptions;

    /// <summary>
    /// Initializes a new instance of the
    /// <see cref="JwtTokenService"/> class.
    /// </summary>
    /// <param name="options">
    /// The application's configured JWT options.
    /// </param>
    /// <exception cref="ArgumentNullException">
    /// Thrown when <paramref name="options"/> is null.
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
        // UTC is deliberately used so that token expiration is independent
        // of the server's local time zone.
        // ---------------------------------------------------------------------

        var expiresAt =
            DateTime.UtcNow.AddMinutes(
                _jwtOptions.ExpirationMinutes);

        // ---------------------------------------------------------------------
        // Create the claims contained within the JWT.
        //
        // These claims represent the authenticated user's identity and role.
        //
        // We include both JWT registered claims and ASP.NET Core Identity-style
        // claims where appropriate because ASP.NET Core authorization and
        // ControllerBase.User commonly work with ClaimTypes values.
        // ---------------------------------------------------------------------

        var claims = new List<Claim>
        {
            // Standard JWT subject claim.
            new(
                JwtRegisteredClaimNames.Sub,
                userId),

            // Standard JWT email claim.
            new(
                JwtRegisteredClaimNames.Email,
                email),

            // ASP.NET Core user identifier claim.
            new(
                ClaimTypes.NameIdentifier,
                userId),

            // ASP.NET Core email claim.
            new(
                ClaimTypes.Email,
                email),

            // ASP.NET Core first-name claim.
            new(
                ClaimTypes.GivenName,
                firstName),

            // ASP.NET Core surname claim.
            new(
                ClaimTypes.Surname,
                lastName),

            // ASP.NET Core display-name claim.
            new(
                ClaimTypes.Name,
                $"{firstName} {lastName}".Trim()),

            // ASP.NET Core role claim.
            //
            // This is particularly important because [Authorize(Roles = "...")]
            // uses the configured role claim to perform role-based authorization.
            new(
                ClaimTypes.Role,
                role)
        };

        // ---------------------------------------------------------------------
        // Convert the configured JWT secret into bytes.
        //
        // The same secret is used by InfrastructureServiceExtensions when
        // configuring JWT Bearer validation.
        // ---------------------------------------------------------------------

        var secretKeyBytes =
            Encoding.UTF8.GetBytes(
                _jwtOptions.SecretKey);

        // ---------------------------------------------------------------------
        // Create the symmetric security key.
        //
        // The KeyId becomes the "kid" value in the JWT header.
        //
        // JwtTokenService.SigningKeyId must match the KeyId configured on the
        // validation key in InfrastructureServiceExtensions.
        // ---------------------------------------------------------------------

        var signingKey =
            new SymmetricSecurityKey(
                secretKeyBytes)
            {
                KeyId = SigningKeyId
            };

        // ---------------------------------------------------------------------
        // Create the signing credentials.
        //
        // HmacSha256 creates an HS256-signed JWT.
        //
        // The same secret key must therefore be available to the JWT Bearer
        // validation configuration so that the signature can be verified.
        // ---------------------------------------------------------------------

        var signingCredentials =
            new SigningCredentials(
                signingKey,
                SecurityAlgorithms.HmacSha256);

        // ---------------------------------------------------------------------
        // Create the JWT.
        //
        // Issuer and audience are embedded into the token and are later
        // validated by ASP.NET Core JWT Bearer authentication.
        // ---------------------------------------------------------------------

        var token =
            new JwtSecurityToken(
                issuer: _jwtOptions.Issuer,
                audience: _jwtOptions.Audience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: signingCredentials);

        // ---------------------------------------------------------------------
        // Serialize the JWT into its compact string representation.
        //
        // The resulting value has the following logical structure:
        //
        //     Header.Payload.Signature
        //
        // The signature is generated from the header and payload using the
        // configured HS256 signing key.
        // ---------------------------------------------------------------------

        var accessToken =
            new JwtSecurityTokenHandler()
                .WriteToken(token);

        // ---------------------------------------------------------------------
        // Return the authentication response.
        //
        // The access token is returned together with the user information
        // needed by the client application.
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