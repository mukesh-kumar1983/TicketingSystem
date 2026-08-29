using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace TicketingSystem.IntegrationTests;

/// <summary>
/// Integration tests for authentication and authenticated-user endpoints.
///
/// These tests exercise the complete HTTP authentication pipeline:
///
/// HTTP request
///     -> AuthController
///     -> AuthenticationService
///     -> ASP.NET Core Identity
///     -> JWT generation
///     -> JWT bearer authentication
///     -> authenticated endpoint
/// </summary>
public sealed class AuthenticationIntegrationTests
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    /// <summary>
    /// Initializes the authentication integration test class.
    /// </summary>
    /// <param name="factory">
    /// The shared integration-test application factory.
    /// </param>
    public AuthenticationIntegrationTests(
        CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// Verifies that a valid seeded account can authenticate successfully.
    /// </summary>
    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOkAndToken()
    {
        using var client =
            _factory.CreateTestClient();

        var response =
            await client.PostAsJsonAsync(
                "/api/Auth/login",
                new
                {
                    email = "customer@ticketingsystem.local",
                    password = "Customer123!"
                });

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);

        using var document =
            JsonDocument.Parse(
                await response.Content.ReadAsStringAsync());

        var token =
            FindStringProperty(
                document.RootElement,
                "token")
            ?? FindStringProperty(
                document.RootElement,
                "accessToken")
            ?? FindStringProperty(
                document.RootElement,
                "jwtToken");

        Assert.False(
            string.IsNullOrWhiteSpace(token));
    }

    /// <summary>
    /// Verifies that invalid credentials are rejected.
    /// </summary>
    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        using var client =
            _factory.CreateTestClient();

        var response =
            await client.PostAsJsonAsync(
                "/api/Auth/login",
                new
                {
                    email = "customer@ticketingsystem.local",
                    password = "WrongPassword123!"
                });

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that a protected endpoint rejects requests without JWT
    /// authentication.
    /// </summary>
    [Fact]
    public async Task GetCurrentUser_WithoutAuthentication_ReturnsUnauthorized()
    {
        using var client =
            _factory.CreateTestClient();

        var response =
            await client.GetAsync(
                "/api/Auth/me");

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that the authenticated user's profile is returned from the
    /// real JWT claims generated during login.
    /// </summary>
    [Fact]
    public async Task GetCurrentUser_WithValidToken_ReturnsCurrentUser()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "customer@ticketingsystem.local",
                "Customer123!");

        var response =
            await client.GetAsync(
                "/api/Auth/me");

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);

        using var document =
            JsonDocument.Parse(
                await response.Content.ReadAsStringAsync());

        var root =
            document.RootElement;

        Assert.Equal(
            "customer@ticketingsystem.local",
            FindStringProperty(
                root,
                "email"));

        Assert.Equal(
            "Customer",
            FindStringProperty(
                root,
                "role"));

        Assert.Equal(
            "Test Customer",
            FindStringProperty(
                root,
                "fullName"));
    }

    /// <summary>
    /// Finds a string property without depending on JSON property casing.
    /// </summary>
    /// <param name="element">
    /// The JSON object.
    /// </param>
    /// <param name="name">
    /// The property name.
    /// </param>
    /// <returns>
    /// The property value when found.
    /// </returns>
    private static string? FindStringProperty(
        JsonElement element,
        string name)
    {
        foreach (var property in element.EnumerateObject())
        {
            if (string.Equals(
                    property.Name,
                    name,
                    StringComparison.OrdinalIgnoreCase))
            {
                return property.Value.ValueKind ==
                       JsonValueKind.String
                    ? property.Value.GetString()
                    : null;
            }
        }

        return null;
    }
}