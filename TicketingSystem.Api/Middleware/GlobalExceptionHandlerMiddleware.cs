using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace TicketingSystem.Api.Middleware;

/// <summary>
/// Provides centralized exception handling for the TicketingSystem API.
///
/// This middleware catches exceptions thrown by downstream middleware,
/// controllers, application services, and infrastructure services and
/// converts them into consistent HTTP API responses.
///
/// Exception mappings:
///
/// UnauthorizedAccessException
///     HTTP 403 Forbidden
///
/// KeyNotFoundException
///     HTTP 404 Not Found
///
/// ArgumentException
///     HTTP 400 Bad Request
///
/// InvalidOperationException
///     HTTP 400 Bad Request
///
/// All other exceptions
///     HTTP 500 Internal Server Error
///
/// Known business-rule exception messages are returned to the client because
/// they are intentionally generated for display to API consumers.
///
/// Unexpected exceptions are always logged with their complete exception
/// details. Outside Development, the response for unexpected exceptions
/// contains only a safe generic message.
/// </summary>
public sealed class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly IHostEnvironment _environment;


/// <summary>
/// Initializes a new instance of the
/// <see cref="GlobalExceptionHandlerMiddleware"/> class.
/// </summary>
/// <param name="next">
/// The next middleware in the HTTP request pipeline.
/// </param>
/// <param name="logger">
/// Logger used to record exceptions.
/// </param>
/// <param name="environment">
/// Current application hosting environment.
/// </param>
public GlobalExceptionHandlerMiddleware(
    RequestDelegate next,
    ILogger<GlobalExceptionHandlerMiddleware> logger,
    IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    /// <summary>
    /// Executes the middleware.
    /// </summary>
    /// <param name="context">
    /// Current HTTP request context.
    /// </param>
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            await HandleExceptionAsync(context, exception);
        }
    }

    /// <summary>
    /// Converts an exception into an appropriate HTTP response.
    /// </summary>
    /// <param name="context">
    /// Current HTTP request context.
    /// </param>
    /// <param name="exception">
    /// Exception thrown by downstream middleware, controllers, or services.
    /// </param>
    private async Task HandleExceptionAsync(
        HttpContext context,
        Exception exception)
    {
        /*
         * Once ASP.NET Core has started sending the response, the status code
         * and headers can no longer be safely replaced.
         *
         * We therefore log the exception and return instead of attempting to
         * write another response.
         */
        if (context.Response.HasStarted)
        {
            _logger.LogError(
                exception,
                "An exception occurred after the HTTP response had already started. Request: {Method} {Path}",
                context.Request.Method,
                context.Request.Path);

            return;
        }

        var statusCode = GetStatusCode(exception);
        var title = GetTitle(statusCode);
        var detail = GetDetail(exception, statusCode);

        _logger.Log(
            GetLogLevel(statusCode),
            exception,
            "API request failed with HTTP {StatusCode}. Request: {Method} {Path}",
            statusCode,
            context.Request.Method,
            context.Request.Path);

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        var problemDetails = new
        {
            type = GetProblemType(statusCode),
            title,
            status = statusCode,
            detail
        };

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(
                problemDetails,
                new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                }));
    }

    /// <summary>
    /// Determines the HTTP status code associated with an exception.
    /// </summary>
    /// <param name="exception">
    /// Exception to evaluate.
    /// </param>
    /// <returns>
    /// Appropriate HTTP status code.
    /// </returns>
    private static int GetStatusCode(Exception exception)
    {
        return exception switch
        {
            UnauthorizedAccessException =>
                StatusCodes.Status403Forbidden,

            KeyNotFoundException =>
                StatusCodes.Status404NotFound,

            ArgumentException =>
                StatusCodes.Status400BadRequest,

            InvalidOperationException =>
                StatusCodes.Status400BadRequest,

            _ =>
                StatusCodes.Status500InternalServerError
        };
    }

    /// <summary>
    /// Gets the human-readable problem title for an HTTP status code.
    /// </summary>
    /// <param name="statusCode">
    /// HTTP status code.
    /// </param>
    /// <returns>
    /// Problem title.
    /// </returns>
    private static string GetTitle(int statusCode)
    {
        return statusCode switch
        {
            StatusCodes.Status400BadRequest =>
                "Bad Request",

            StatusCodes.Status401Unauthorized =>
                "Unauthorized",

            StatusCodes.Status403Forbidden =>
                "Forbidden",

            StatusCodes.Status404NotFound =>
                "Not Found",

            StatusCodes.Status500InternalServerError =>
                "Internal Server Error",

            _ =>
                "Request Failed"
        };
    }

    /// <summary>
    /// Gets the response detail associated with the exception.
    ///
    /// Known application exceptions are safe to expose because they contain
    /// intentional business-rule messages.
    ///
    /// Unexpected exceptions are hidden outside Development so implementation
    /// details and sensitive exception information are not exposed to API
    /// clients.
    /// </summary>
    /// <param name="exception">
    /// Exception being handled.
    /// </param>
    /// <param name="statusCode">
    /// HTTP status code associated with the exception.
    /// </param>
    /// <returns>
    /// Safe response detail.
    /// </returns>
    private string GetDetail(
        Exception exception,
        int statusCode)
    {
        if (statusCode != StatusCodes.Status500InternalServerError)
        {
            return string.IsNullOrWhiteSpace(exception.Message)
                ? GetTitle(statusCode)
                : exception.Message;
        }

        if (_environment.IsDevelopment())
        {
            return exception.Message;
        }

        return "An unexpected error occurred while processing the request.";
    }

    /// <summary>
    /// Determines the logging level associated with an HTTP status code.
    /// </summary>
    /// <param name="statusCode">
    /// HTTP status code.
    /// </param>
    /// <returns>
    /// Appropriate logging level.
    /// </returns>
    private static LogLevel GetLogLevel(int statusCode)
    {
        return statusCode switch
        {
            StatusCodes.Status400BadRequest =>
                LogLevel.Warning,

            StatusCodes.Status401Unauthorized =>
                LogLevel.Warning,

            StatusCodes.Status403Forbidden =>
                LogLevel.Warning,

            StatusCodes.Status404NotFound =>
                LogLevel.Information,

            _ =>
                LogLevel.Error
        };
    }

    /// <summary>
    /// Gets the standard problem-details URI associated with an HTTP status.
    /// </summary>
    /// <param name="statusCode">
    /// HTTP status code.
    /// </param>
    /// <returns>
    /// Problem-details URI.
    /// </returns>
    private static string GetProblemType(int statusCode)
    {
        return $"https://httpstatuses.com/{statusCode}";
    }


}
