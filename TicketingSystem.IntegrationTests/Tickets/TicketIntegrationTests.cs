
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace TicketingSystem.IntegrationTests;

/// <summary>
/// Integration tests for the Tickets API.
///
/// These tests verify authentication, role authorization, ticket creation,
/// retrieval, customer isolation, update, assignment, status changes,
/// pagination and ticket details through real HTTP requests.
/// </summary>
public sealed class TicketIntegrationTests
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    /// <summary>
    /// Initializes the ticket integration test class.
    /// </summary>
    /// <param name="factory">
    /// The shared integration-test application factory.
    /// </param>
    public TicketIntegrationTests(
        CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// Verifies that an unauthenticated request cannot retrieve tickets.
    /// </summary>
    [Fact]
    public async Task GetTickets_WithoutAuthentication_ReturnsUnauthorized()
    {
        using var client =
            _factory.CreateTestClient();

        var response =
            await client.GetAsync(
                "/api/Tickets");

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that an authenticated customer can retrieve tickets.
    /// </summary>
    [Fact]
    public async Task GetTickets_AsCustomer_ReturnsOk()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "customer@ticketingsystem.local",
                "Customer123!");

        var response =
            await client.GetAsync(
                "/api/Tickets");

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that a customer can create a ticket.
    /// </summary>
    [Fact]
    public async Task CreateTicket_AsCustomer_ReturnsCreated()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "customer@ticketingsystem.local",
                "Customer123!");

        var response =
            await client.PostAsJsonAsync(
                "/api/Tickets",
                new
                {
                    title =
                        $"Integration Test Ticket {Guid.NewGuid():N}",

                    description =
                        "Ticket created by an integration test.",

                    priority = 2
                });

        Assert.Equal(
            HttpStatusCode.Created,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that a support agent cannot create a ticket because the
    /// TicketsController explicitly restricts creation to Admin and Customer.
    /// </summary>
    [Fact]
    public async Task CreateTicket_AsSupportAgent_ReturnsForbidden()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "agent@ticketingsystem.local",
                "Agent123!");

        var response =
            await client.PostAsJsonAsync(
                "/api/Tickets",
                new
                {
                    title =
                        $"Unauthorized Agent Ticket {Guid.NewGuid():N}",

                    description =
                        "This ticket must not be created.",

                    priority = 2
                });

        Assert.Equal(
            HttpStatusCode.Forbidden,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that a newly created ticket can subsequently be retrieved
    /// using its identifier.
    /// </summary>
    [Fact]
    public async Task GetTicket_AfterCreation_ReturnsTicket()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "customer@ticketingsystem.local",
                "Customer123!");

        var createResponse =
            await client.PostAsJsonAsync(
                "/api/Tickets",
                new
                {
                    title =
                        $"Retrieval Test {Guid.NewGuid():N}",

                    description =
                        "Integration retrieval test.",

                    priority = 2
                });

        Assert.Equal(
            HttpStatusCode.Created,
            createResponse.StatusCode);

        using var document =
            JsonDocument.Parse(
                await createResponse.Content.ReadAsStringAsync());

        var ticketId =
            FindLongProperty(
                document.RootElement,
                "id");

        Assert.True(ticketId > 0);

        var getResponse =
            await client.GetAsync(
                $"/api/Tickets/{ticketId}");

        Assert.Equal(
            HttpStatusCode.OK,
            getResponse.StatusCode);
    }

    /// <summary>
    /// Verifies customer data isolation.
    ///
    /// A customer can only retrieve tickets belonging to that customer.
    /// The API intentionally returns NotFound for another customer's ticket
    /// so that ticket existence is not disclosed.
    /// </summary>
    [Fact]
    public async Task GetTicket_AsDifferentCustomer_ReturnsNotFound()
    {
        using var customerClient =
            await _factory.CreateAuthenticatedClientAsync(
                "customer@ticketingsystem.local",
                "Customer123!");

        var createResponse =
            await customerClient.PostAsJsonAsync(
                "/api/Tickets",
                new
                {
                    title =
                        $"Isolation Test {Guid.NewGuid():N}",

                    description =
                        "Customer isolation integration test.",

                    priority = 2
                });

        Assert.Equal(
            HttpStatusCode.Created,
            createResponse.StatusCode);

        using var document =
            JsonDocument.Parse(
                await createResponse.Content.ReadAsStringAsync());

        var ticketId =
            FindLongProperty(
                document.RootElement,
                "id");

        Assert.True(ticketId > 0);

        using var adminClient =
            await _factory.CreateAuthenticatedClientAsync(
                "admin@ticketingsystem.local",
                "Admin123!");

        var uniqueEmail =
            $"isolation-{Guid.NewGuid():N}@ticketingsystem.local";

        var createUserResponse =
            await adminClient.PostAsJsonAsync(
                "/api/Users",
                new
                {
                    email = uniqueEmail,
                    firstName = "Isolation",
                    lastName = "Customer",
                    password = "Customer123!",
                    role = "Customer"
                });

        Assert.Equal(
            HttpStatusCode.Created,
            createUserResponse.StatusCode);

        using var secondCustomerClient =
            await _factory.CreateAuthenticatedClientAsync(
                uniqueEmail,
                "Customer123!");

        var response =
            await secondCustomerClient.GetAsync(
                $"/api/Tickets/{ticketId}");

        Assert.Equal(
            HttpStatusCode.NotFound,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that a support agent can retrieve the ticket list.
    /// </summary>
    [Fact]
    public async Task GetTickets_AsSupportAgent_ReturnsOk()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "agent@ticketingsystem.local",
                "Agent123!");

        var response =
            await client.GetAsync(
                "/api/Tickets");

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that an administrator can retrieve the ticket list.
    /// </summary>
    [Fact]
    public async Task GetTickets_AsAdmin_ReturnsOk()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "admin@ticketingsystem.local",
                "Admin123!");

        var response =
            await client.GetAsync(
                "/api/Tickets");

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that a created ticket can be updated.
    /// </summary>
    [Fact]
    public async Task UpdateTicket_AsCustomer_ReturnsOk()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "customer@ticketingsystem.local",
                "Customer123!");

        var createResponse =
            await client.PostAsJsonAsync(
                "/api/Tickets",
                new
                {
                    title =
                        $"Update Test {Guid.NewGuid():N}",

                    description =
                        "Original ticket description.",

                    priority = 2
                });

        Assert.Equal(
            HttpStatusCode.Created,
            createResponse.StatusCode);

        using var document =
            JsonDocument.Parse(
                await createResponse.Content.ReadAsStringAsync());

        var ticketId =
            FindLongProperty(
                document.RootElement,
                "id");

        Assert.True(ticketId > 0);

        var updateResponse =
            await client.PutAsJsonAsync(
                $"/api/Tickets/{ticketId}",
                new
                {
                    title =
                        "Updated integration test ticket",

                    description =
                        "Updated ticket description.",

                    priority = 3
                });

        Assert.Equal(
            HttpStatusCode.OK,
            updateResponse.StatusCode);
    }

    /// <summary>
    /// Verifies that an administrator can assign a ticket to a support agent.
    ///
    /// The AssignTicketRequest contract uses the JSON property "agentId".
    /// </summary>
    [Fact]
    public async Task AssignTicket_AsAdmin_ReturnsOk()
    {
        using var customerClient =
            await _factory.CreateAuthenticatedClientAsync(
                "customer@ticketingsystem.local",
                "Customer123!");

        var createResponse =
            await customerClient.PostAsJsonAsync(
                "/api/Tickets",
                new
                {
                    title =
                        $"Assignment Test {Guid.NewGuid():N}",

                    description =
                        "Assignment integration test.",

                    priority = 2
                });

        Assert.Equal(
            HttpStatusCode.Created,
            createResponse.StatusCode);

        using var ticketDocument =
            JsonDocument.Parse(
                await createResponse.Content.ReadAsStringAsync());

        var ticketId =
            FindLongProperty(
                ticketDocument.RootElement,
                "id");

        Assert.True(ticketId > 0);

        using var adminClient =
            await _factory.CreateAuthenticatedClientAsync(
                "admin@ticketingsystem.local",
                "Admin123!");

        using var agentResponse =
            await adminClient.GetAsync(
                "/api/Users/agents");

        Assert.Equal(
            HttpStatusCode.OK,
            agentResponse.StatusCode);

        using var agentsDocument =
            JsonDocument.Parse(
                await agentResponse.Content.ReadAsStringAsync());

        var agentId =
            FindFirstUserId(
                agentsDocument.RootElement);

        Assert.False(
            string.IsNullOrWhiteSpace(agentId));

        var assignmentResponse =
            await adminClient.PatchAsJsonAsync(
                $"/api/Tickets/{ticketId}/assign",
                new
                {
                    agentId = agentId
                });

        Assert.Equal(
            HttpStatusCode.OK,
            assignmentResponse.StatusCode);
    }

    /// <summary>
    /// Verifies that a ticket status can be changed through the real API.
    /// </summary>
    [Fact]
    public async Task UpdateTicketStatus_AsAdmin_ReturnsOk()
    {
        using var customerClient =
            await _factory.CreateAuthenticatedClientAsync(
                "customer@ticketingsystem.local",
                "Customer123!");

        var createResponse =
            await customerClient.PostAsJsonAsync(
                "/api/Tickets",
                new
                {
                    title =
                        $"Status Test {Guid.NewGuid():N}",

                    description =
                        "Status integration test.",

                    priority = 2
                });

        Assert.Equal(
            HttpStatusCode.Created,
            createResponse.StatusCode);

        using var document =
            JsonDocument.Parse(
                await createResponse.Content.ReadAsStringAsync());

        var ticketId =
            FindLongProperty(
                document.RootElement,
                "id");

        Assert.True(ticketId > 0);

        using var adminClient =
            await _factory.CreateAuthenticatedClientAsync(
                "admin@ticketingsystem.local",
                "Admin123!");

        var statusResponse =
            await adminClient.PatchAsJsonAsync(
                $"/api/Tickets/{ticketId}/status",
                new
                {
                    status = 1
                });

        Assert.Equal(
            HttpStatusCode.OK,
            statusResponse.StatusCode);
    }

    /// <summary>
    /// Verifies that the complete ticket-details endpoint returns a
    /// successfully created ticket.
    /// </summary>
    [Fact]
    public async Task GetTicketDetails_AfterCreation_ReturnsOk()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "customer@ticketingsystem.local",
                "Customer123!");

        var createResponse =
            await client.PostAsJsonAsync(
                "/api/Tickets",
                new
                {
                    title =
                        $"Details Test {Guid.NewGuid():N}",

                    description =
                        "Ticket details integration test.",

                    priority = 2
                });

        Assert.Equal(
            HttpStatusCode.Created,
            createResponse.StatusCode);

        using var document =
            JsonDocument.Parse(
                await createResponse.Content.ReadAsStringAsync());

        var ticketId =
            FindLongProperty(
                document.RootElement,
                "id");

        Assert.True(ticketId > 0);

        var detailsResponse =
            await client.GetAsync(
                $"/api/Tickets/{ticketId}/details");

        Assert.Equal(
            HttpStatusCode.OK,
            detailsResponse.StatusCode);
    }

    /// <summary>
    /// Verifies that ticket pagination parameters are accepted by the API.
    /// </summary>
    [Fact]
    public async Task GetTickets_WithPagination_ReturnsOk()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "admin@ticketingsystem.local",
                "Admin123!");

        var response =
            await client.GetAsync(
                "/api/Tickets?pageNumber=1&pageSize=10");

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);
    }

    /// <summary>
    /// Finds the numeric identifier of a JSON object.
    /// </summary>
    private static long FindLongProperty(
        JsonElement element,
        string propertyName)
    {
        foreach (var property in element.EnumerateObject())
        {
            if (!string.Equals(
                    property.Name,
                    propertyName,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (property.Value.ValueKind ==
                JsonValueKind.Number &&
                property.Value.TryGetInt64(
                    out var value))
            {
                return value;
            }
        }

        return 0;
    }

    /// <summary>
    /// Finds the first user's identifier from a users JSON response.
    /// </summary>
    private static string? FindFirstUserId(
        JsonElement element)
    {
        if (element.ValueKind ==
            JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
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
        foreach (var property in element.EnumerateObject())
        {
            if (!string.Equals(
                    property.Name,
                    propertyName,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            return property.Value.ValueKind ==
                   JsonValueKind.String
                ? property.Value.GetString()
                : null;
        }

        return null;
    }
}

