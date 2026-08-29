
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace TicketingSystem.IntegrationTests;

/// <summary>
/// Integration tests for ticket time-entry endpoints.
///
/// These tests verify the complete HTTP pipeline for recording and
/// retrieving work performed against support tickets.
///
/// The tests intentionally use the real authentication, user, ticket,
/// assignment, and time-entry APIs rather than directly manipulating
/// the database.
/// </summary>
public sealed class TimeEntryIntegrationTests
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    /// <summary>
    /// Initializes a new instance of the
    /// <see cref="TimeEntryIntegrationTests"/> class.
    /// </summary>
    /// <param name="factory">
    /// The shared integration-test application factory.
    /// </param>
    public TimeEntryIntegrationTests(
        CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// Verifies that an authenticated user can retrieve time entries
    /// belonging to a ticket they are authorized to access.
    /// </summary>
    [Fact]
    public async Task GetTimeEntries_ForTicket_ReturnsOk()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "customer@ticketingsystem.local",
                "Customer123!");

        var ticketId =
            await CreateTicketAsync(client);

        var response =
            await client.GetAsync(
                $"/api/tickets/{ticketId}/time-entries");

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that a support agent can record work against a ticket
    /// after the ticket has been explicitly assigned to that same agent.
    ///
    /// The test deliberately resolves the exact seeded support agent
    /// by email instead of simply selecting the first agent returned
    /// by the API. This prevents the test from accidentally assigning
    /// the ticket to a different support agent.
    /// </summary>
    [Fact]
    public async Task CreateTimeEntry_ForTicket_ReturnsCreated()
    {
        using var adminClient =
            await _factory.CreateAuthenticatedClientAsync(
                "admin@ticketingsystem.local",
                "Admin123!");

        /*
         * --------------------------------------------------------------------
         * Step 1: Create a ticket through the real Tickets API.
         * --------------------------------------------------------------------
         *
         * The ticket is created by the administrator because the administrator
         * will also perform the assignment operation immediately afterward.
         */
        var ticketId =
            await CreateTicketAsync(adminClient);

        /*
         * --------------------------------------------------------------------
         * Step 2: Find the exact seeded support agent.
         * --------------------------------------------------------------------
         *
         * Do not simply select the first item from /api/Users/agents.
         * Other integration tests may create additional users, and the order
         * of the returned collection should never be relied upon.
         */
        var agentId =
            await GetSeededSupportAgentIdAsync(
                adminClient);

        Assert.False(
            string.IsNullOrWhiteSpace(agentId),
            "The seeded support agent could not be found.");

        /*
         * --------------------------------------------------------------------
         * Step 3: Assign the ticket to the exact support agent.
         * --------------------------------------------------------------------
         *
         * AssignTicketRequest uses the property AgentId.
         */
        var assignmentResponse =
            await adminClient.PatchAsJsonAsync(
                $"/api/Tickets/{ticketId}/assign",
                new
                {
                    AgentId = agentId
                });

        var assignmentBody =
            await assignmentResponse.Content.ReadAsStringAsync();

        Assert.True(
            assignmentResponse.StatusCode == HttpStatusCode.OK,
            $"Ticket assignment failed. " +
            $"HTTP {(int)assignmentResponse.StatusCode} " +
            $"{assignmentResponse.StatusCode}. " +
            $"Response: {assignmentBody}");

        /*
         * --------------------------------------------------------------------
         * Step 4: Verify the assignment persisted.
         * --------------------------------------------------------------------
         *
         * This is important because the time-entry service only allows a
         * support agent to record work when:
         *
         *     ticket.AssignedAgentId == authenticatedUserId
         *
         * Therefore, verify the persisted assignment before attempting
         * to create the time entry.
         */
        var assignedTicketResponse =
            await adminClient.GetAsync(
                $"/api/Tickets/{ticketId}");

        var assignedTicketBody =
            await assignedTicketResponse.Content.ReadAsStringAsync();

        Assert.Equal(
            HttpStatusCode.OK,
            assignedTicketResponse.StatusCode);

        using var assignedTicketDocument =
            JsonDocument.Parse(
                assignedTicketBody);

        var assignedAgentId =
            FindStringProperty(
                assignedTicketDocument.RootElement,
                "assignedAgentId");

        Assert.Equal(
            agentId,
            assignedAgentId);

        /*
         * --------------------------------------------------------------------
         * Step 5: Authenticate specifically as the seeded support agent.
         * --------------------------------------------------------------------
         *
         * This must be the same identity whose ID was stored in
         * Ticket.AssignedAgentId.
         */
        using var agentClient =
            await _factory.CreateAuthenticatedClientAsync(
                "agent@ticketingsystem.local",
                "Agent123!");

        /*
         * --------------------------------------------------------------------
         * Step 6: Record work against the assigned ticket.
         * --------------------------------------------------------------------
         *
         * The duration is supplied as an ISO-8601 TimeSpan-compatible value.
         * The API model binder converts "01:30:00" into a TimeSpan.
         */
        var response =
            await agentClient.PostAsJsonAsync(
                $"/api/tickets/{ticketId}/time-entries",
                new
                {
                    workDate =
                        DateTime.UtcNow.Date,

                    duration =
                        "01:30:00",

                    description =
                        "Integration-test support work."
                });

        var responseBody =
            await response.Content.ReadAsStringAsync();

        Assert.True(
            response.StatusCode == HttpStatusCode.Created,
            $"Time-entry creation failed. " +
            $"HTTP {(int)response.StatusCode} " +
            $"{response.StatusCode}. " +
            $"Response: {responseBody}");
    }

    /// <summary>
    /// Verifies that an unauthenticated request cannot retrieve time entries.
    /// </summary>
    [Fact]
    public async Task GetTimeEntries_WithoutAuthentication_ReturnsUnauthorized()
    {
        using var client =
            _factory.CreateTestClient();

        var response =
            await client.GetAsync(
                "/api/tickets/1/time-entries");

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            response.StatusCode);
    }

    /// <summary>
    /// Creates a ticket through the real Tickets API and returns its
    /// database-generated identifier.
    /// </summary>
    /// <param name="client">
    /// An authenticated HTTP client authorized to create tickets.
    /// </param>
    /// <returns>
    /// The identifier of the newly created ticket.
    /// </returns>
    private static async Task<long> CreateTicketAsync(
        HttpClient client)
    {
        var response =
            await client.PostAsJsonAsync(
                "/api/Tickets",
                new
                {
                    title =
                        $"Time Entry Test {Guid.NewGuid():N}",

                    description =
                        "Time-entry integration test ticket.",

                    priority = 2
                });

        var responseBody =
            await response.Content.ReadAsStringAsync();

        Assert.True(
            response.StatusCode == HttpStatusCode.Created,
            $"Ticket creation failed. " +
            $"HTTP {(int)response.StatusCode} " +
            $"{response.StatusCode}. " +
            $"Response: {responseBody}");

        using var document =
            JsonDocument.Parse(
                responseBody);

        var ticketId =
            FindLongProperty(
                document.RootElement,
                "id");

        Assert.True(
            ticketId > 0,
            "The ticket creation response did not contain a valid ticket id.");

        return ticketId;
    }

    /// <summary>
    /// Retrieves the identifier of the seeded support agent.
    ///
    /// The lookup is performed by email so that the integration test always
    /// assigns the ticket to the same identity that is later used to
    /// authenticate the time-entry request.
    /// </summary>
    /// <param name="adminClient">
    /// An authenticated administrator HTTP client.
    /// </param>
    /// <returns>
    /// The identifier of the seeded support agent.
    /// </returns>
    private static async Task<string?> GetSeededSupportAgentIdAsync(
        HttpClient adminClient)
    {
        var response =
            await adminClient.GetAsync(
                "/api/Users/agents");

        var responseBody =
            await response.Content.ReadAsStringAsync();

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);

        using var document =
            JsonDocument.Parse(
                responseBody);

        /*
         * The agents endpoint is expected to return an array of users.
         *
         * We intentionally search the collection for the known seeded
         * support-agent email rather than depending on collection order.
         */
        if (document.RootElement.ValueKind ==
            JsonValueKind.Array)
        {
            foreach (var agent in
                     document.RootElement.EnumerateArray())
            {
                var email =
                    FindStringProperty(
                        agent,
                        "email");

                if (!string.Equals(
                        email,
                        "agent@ticketingsystem.local",
                        StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                return FindStringProperty(
                    agent,
                    "id");
            }
        }

        /*
         * Some API response wrappers may return an object containing an
         * items collection. Support that shape as well without changing
         * the application's API architecture.
         */
        if (document.RootElement.ValueKind ==
            JsonValueKind.Object)
        {
            foreach (var property in
                     document.RootElement.EnumerateObject())
            {
                if (property.Value.ValueKind !=
                    JsonValueKind.Array)
                {
                    continue;
                }

                foreach (var agent in
                         property.Value.EnumerateArray())
                {
                    var email =
                        FindStringProperty(
                            agent,
                            "email");

                    if (!string.Equals(
                            email,
                            "agent@ticketingsystem.local",
                            StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    return FindStringProperty(
                        agent,
                        "id");
                }
            }
        }

        return null;
    }

    /// <summary>
    /// Finds a numeric property in a JSON object.
    /// </summary>
    /// <param name="element">
    /// The JSON object to inspect.
    /// </param>
    /// <param name="propertyName">
    /// The property name to locate.
    /// </param>
    /// <returns>
    /// The numeric property value, or zero when the property is not found.
    /// </returns>
    private static long FindLongProperty(
        JsonElement element,
        string propertyName)
    {
        foreach (var property in
                 element.EnumerateObject())
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
    /// Finds a string property in a JSON object.
    /// </summary>
    /// <param name="element">
    /// The JSON object to inspect.
    /// </param>
    /// <param name="propertyName">
    /// The property name to locate.
    /// </param>
    /// <returns>
    /// The string property value, or <see langword="null"/> when the
    /// property is not found or is not a JSON string.
    /// </returns>
    private static string? FindStringProperty(
        JsonElement element,
        string propertyName)
    {
        if (element.ValueKind !=
            JsonValueKind.Object)
        {
            return null;
        }

        foreach (var property in
                 element.EnumerateObject())
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
