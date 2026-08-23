namespace TicketingSystem.Infrastructure.Authentication;

/// <summary>
/// Represents the configuration required to generate and validate JWT access tokens.
/// </summary>
public sealed class JwtOptions
{
    /// <summary>
    /// Gets the configuration section name used for JWT settings.
    /// </summary>
    public const string SectionName = "Jwt";

    /// <summary>
    /// Gets or sets the secret key used to sign JWT tokens.
    /// </summary>
    public string SecretKey { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the token issuer.
    /// </summary>
    public string Issuer { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the token audience.
    /// </summary>
    public string Audience { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the token lifetime in minutes.
    /// </summary>
    public int ExpirationMinutes { get; set; } = 60;
}