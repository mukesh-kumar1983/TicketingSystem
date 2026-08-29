using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace TicketingSystem.IntegrationTests;

/// <summary>
/// Integration tests for administrative user-management endpoints.
///
/// These tests verify the real authorization boundary of UsersController:
/// only authenticated administrators may manage Customer and SupportAgent
/// accounts.
/// </summary>
public sealed class UserIntegrationTests
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    /// <summary>
    /// Initializes the user integration test class.
    /// </summary>
    /// <param name="factory">
    /// The shared integration-test application factory.
    /// </param>
    public UserIntegrationTests(
        CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// Verifies that an administrator can retrieve customers.
    /// </summary>
    [Fact]
    public async Task GetCustomers_AsAdmin_ReturnsOk()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "admin@ticketingsystem.local",
                "Admin123!");

        var response =
            await client.GetAsync(
                "/api/Users/customers");

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that an administrator can retrieve support agents.
    /// </summary>
    [Fact]
    public async Task GetAgents_AsAdmin_ReturnsOk()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "admin@ticketingsystem.local",
                "Admin123!");

        var response =
            await client.GetAsync(
                "/api/Users/agents");

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that a customer cannot access administrative user management.
    /// </summary>
    [Fact]
    public async Task GetCustomers_AsCustomer_ReturnsForbidden()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "customer@ticketingsystem.local",
                "Customer123!");

        var response =
            await client.GetAsync(
                "/api/Users/customers");

        Assert.Equal(
            HttpStatusCode.Forbidden,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that an administrator can create a customer account.
    /// </summary>
    [Fact]
    public async Task CreateCustomer_AsAdmin_ReturnsCreated()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "admin@ticketingsystem.local",
                "Admin123!");

        var email =
            $"integration-{Guid.NewGuid():N}@ticketingsystem.local";

        var response =
            await client.PostAsJsonAsync(
                "/api/Users",
                new
                {
                    email,
                    firstName = "Integration",
                    lastName = "Customer",
                    password = "Customer123!",
                    role = "Customer"
                });

        Assert.Equal(
            HttpStatusCode.Created,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that an administrator can create a support-agent account.
    /// </summary>
    [Fact]
    public async Task CreateAgent_AsAdmin_ReturnsCreated()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "admin@ticketingsystem.local",
                "Admin123!");

        var email =
            $"agent-{Guid.NewGuid():N}@ticketingsystem.local";

        var response =
            await client.PostAsJsonAsync(
                "/api/Users",
                new
                {
                    email,
                    firstName = "Integration",
                    lastName = "Agent",
                    password = "Agent123!",
                    role = "SupportAgent"
                });

        Assert.Equal(
            HttpStatusCode.Created,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that an administrator can retrieve an individual user.
    /// </summary>
    [Fact]
    public async Task GetUser_AsAdmin_ReturnsOk()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "admin@ticketingsystem.local",
                "Admin123!");

        var agentsResponse =
            await client.GetAsync(
                "/api/Users/agents");

        Assert.Equal(
            HttpStatusCode.OK,
            agentsResponse.StatusCode);

        using var document =
            JsonDocument.Parse(
                await agentsResponse.Content.ReadAsStringAsync());

        var agentId =
            FindFirstId(
                document.RootElement);

        Assert.False(
            string.IsNullOrWhiteSpace(agentId));

        var response =
            await client.GetAsync(
                $"/api/Users/{agentId}");

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that a nonexistent user returns HTTP 404.
    /// </summary>
    [Fact]
    public async Task GetUser_WithUnknownId_ReturnsNotFound()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "admin@ticketingsystem.local",
                "Admin123!");

        var response =
            await client.GetAsync(
                "/api/Users/does-not-exist");

        Assert.Equal(
            HttpStatusCode.NotFound,
            response.StatusCode);
    }

    /// <summary>
    /// Finds the first user identifier in an API response.
    /// </summary>
    private static string? FindFirstId(
        JsonElement element)
    {
        if (element.ValueKind ==
            JsonValueKind.Array)
        {
            foreach (var item in
                     element.EnumerateArray())
            {
                var id =
                    FindStringProperty(
                        item,
                        "id");

                if (!string.IsNullOrWhiteSpace(id))
                {
                    return id;
                }
            }
        }

        return FindStringProperty(
            element,
            "id");
    }

    /// <summary>
    /// Finds a string property in a JSON object.
    /// </summary>
    private static string? FindStringProperty(
        JsonElement element,
        string propertyName)
    {
        foreach (var property in
                 element.EnumerateObject())
        {
            if (string.Equals(
                    property.Name,
                    propertyName,
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