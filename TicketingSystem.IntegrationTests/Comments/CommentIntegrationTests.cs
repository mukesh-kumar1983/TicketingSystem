using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace TicketingSystem.IntegrationTests;

/// <summary>
/// Integration tests for the ticket comments API.
///
/// These tests exercise the real comments controller, authorization,
/// application service and database pipeline.
/// </summary>
public sealed class CommentIntegrationTests
    : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    /// <summary>
    /// Initializes the comment integration test class.
    /// </summary>
    /// <param name="factory">
    /// The shared integration-test application factory.
    /// </param>
    public CommentIntegrationTests(
        CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// Verifies that an authenticated customer can add a comment to their
    /// ticket.
    /// </summary>
    [Fact]
    public async Task CreateComment_OnCustomerTicket_ReturnsCreated()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "customer@ticketingsystem.local",
                "Customer123!");

        var ticketId =
            await CreateTicketAsync(client);

        var response =
            await client.PostAsJsonAsync(
                $"/api/tickets/{ticketId}/comments",
                new
                {
                    content =
                        "This is an integration-test comment."
                });

        Assert.Equal(
            HttpStatusCode.Created,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that comments can be retrieved after creation.
    /// </summary>
    [Fact]
    public async Task GetComments_AfterCreation_ReturnsOk()
    {
        using var client =
            await _factory.CreateAuthenticatedClientAsync(
                "customer@ticketingsystem.local",
                "Customer123!");

        var ticketId =
            await CreateTicketAsync(client);

        var createResponse =
            await client.PostAsJsonAsync(
                $"/api/tickets/{ticketId}/comments",
                new
                {
                    content =
                        "Comment retrieval integration test."
                });

        Assert.Equal(
            HttpStatusCode.Created,
            createResponse.StatusCode);

        var response =
            await client.GetAsync(
                $"/api/tickets/{ticketId}/comments");

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);
    }

    /// <summary>
    /// Verifies that an unauthenticated request to comments is rejected.
    /// </summary>
    [Fact]
    public async Task GetComments_WithoutAuthentication_ReturnsUnauthorized()
    {
        using var client =
            _factory.CreateTestClient();

        var response =
            await client.GetAsync(
                "/api/tickets/1/comments");

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            response.StatusCode);
    }

    /// <summary>
    /// Creates a ticket through the real API and returns its identifier.
    /// </summary>
    private static async Task<long> CreateTicketAsync(
        HttpClient client)
    {
        var response =
            await client.PostAsJsonAsync(
                "/api/Tickets",
                new
                {
                    title =
                        $"Comment Test {Guid.NewGuid():N}",

                    description =
                        "Comment integration test ticket.",

                    priority = 2
                });

        Assert.Equal(
            HttpStatusCode.Created,
            response.StatusCode);

        using var document =
            JsonDocument.Parse(
                await response.Content.ReadAsStringAsync());

        foreach (var property in
                 document.RootElement.EnumerateObject())
        {
            if (string.Equals(
                    property.Name,
                    "id",
                    StringComparison.OrdinalIgnoreCase) &&
                property.Value.TryGetInt64(
                    out var id))
            {
                return id;
            }
        }

        throw new InvalidOperationException(
            "The ticket creation response did not contain an id.");
    }
}