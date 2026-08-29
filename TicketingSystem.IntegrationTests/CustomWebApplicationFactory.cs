using System.Net.Http.Headers;
using System.Net.Http.Json;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

using TicketingSystem.Application.DTOs.Authentication;

namespace TicketingSystem.IntegrationTests;

/// <summary>
/// Provides an in-process ASP.NET Core test host for TicketingSystem
/// integration tests.
///
/// The factory starts the real TicketingSystem API application and provides
/// helper methods for creating HTTP clients used by integration tests.
///
/// The authentication helper logs in through the real authentication endpoint
/// and places the returned JWT access token on the HttpClient. This allows
/// authenticated integration tests to exercise the same authentication and
/// authorization pipeline used by the application.
/// </summary>
public sealed class CustomWebApplicationFactory
    : WebApplicationFactory<Program>
{
    /// <summary>
    /// Creates an HTTP client connected to the test application.
    ///
    /// The client does not require the API to be started manually because
    /// WebApplicationFactory hosts the ASP.NET Core application in-process.
    /// </summary>
    /// <returns>
    /// An HTTP client configured for the test application.
    /// </returns>
    public HttpClient CreateTestClient()
    {
        return CreateClient(
            new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false
            });
    }

    /// <summary>
    /// Creates an authenticated HTTP client by logging in through the real
    /// TicketingSystem authentication endpoint.
    ///
    /// The default seeded administrator account is used when no credentials
    /// are supplied.
    ///
    /// The JWT returned by the login endpoint is automatically added to the
    /// client's Authorization header using the Bearer authentication scheme.
    /// </summary>
    /// <param name="email">
    /// The email address of the user used for authentication.
    /// </param>
    /// <param name="password">
    /// The password of the user used for authentication.
    /// </param>
    /// <returns>
    /// An authenticated HTTP client.
    /// </returns>
    public async Task<HttpClient> CreateAuthenticatedClientAsync(
        string email = "admin@ticketingsystem.local",
        string password = "Admin123!")
    {
        var client = CreateTestClient();

        var loginRequest = new LoginRequest
        {
            Email = email,
            Password = password
        };

        using var loginResponse =
            await client.PostAsJsonAsync(
                "/api/Auth/login",
                loginRequest);

        /*
         * If authentication fails, fail immediately and include the API
         * response. This makes integration-test failures much easier to
         * diagnose.
         */
        if (!loginResponse.IsSuccessStatusCode)
        {
            var responseBody =
                await loginResponse.Content.ReadAsStringAsync();

            throw new InvalidOperationException(
                "Unable to authenticate the integration-test user. " +
                $"HTTP {(int)loginResponse.StatusCode} " +
                $"{loginResponse.StatusCode}. " +
                $"Response: {responseBody}");
        }

        var authenticationResponse =
            await loginResponse.Content
                .ReadFromJsonAsync<LoginResponse>();

        if (authenticationResponse is null ||
            string.IsNullOrWhiteSpace(
                authenticationResponse.AccessToken))
        {
            throw new InvalidOperationException(
                "The authentication endpoint returned a successful response " +
                "but no JWT access token was found.");
        }

        /*
         * Attach the JWT returned by the real login endpoint to all subsequent
         * requests made through this client.
         */
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                authenticationResponse.AccessToken);

        return client;
    }

    /// <summary>
    /// Configures the ASP.NET Core test host.
    /// </summary>
    /// <param name="builder">
    /// The web-host builder used to configure the test application.
    /// </param>
    protected override void ConfigureWebHost(
        IWebHostBuilder builder)
    {
        /*
         * Use the Testing environment so the application can distinguish
         * integration-test execution from normal Development execution.
         */
        builder.UseEnvironment("Testing");
    }
}