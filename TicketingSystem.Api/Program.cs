using TicketingSystem.Api.Middleware;
using TicketingSystem.Application.Services;
using TicketingSystem.Infrastructure.DependencyInjection;
using TicketingSystem.Infrastructure.Seeding;

var builder = WebApplication.CreateBuilder(args);

// =============================================================================
// SERVICES
// =============================================================================

// -----------------------------------------------------------------------------
// MVC / API
// -----------------------------------------------------------------------------

// Registers ASP.NET Core MVC controllers.
//
// This allows controllers such as AuthController and TicketsController
// to be discovered and exposed as HTTP API endpoints.
builder.Services.AddControllers();

// Registers API endpoint metadata required by Swagger/OpenAPI.
builder.Services.AddEndpointsApiExplorer();

// -----------------------------------------------------------------------------
// CORS
// -----------------------------------------------------------------------------

// Registers Cross-Origin Resource Sharing (CORS) support.
//
// The Angular development application runs on:
//
//     http://localhost:4200
//
// while the ASP.NET Core API runs on:
//
//     https://localhost:7223
//
// Because these are different origins, browsers enforce the CORS policy.
builder.Services.AddCors(options =>
{
    options.AddPolicy(
    "AngularClient",
    policy =>
    {
        policy
    .WithOrigins("http://localhost:4200")
    .AllowAnyHeader()
    .AllowAnyMethod();
    });
});

// -----------------------------------------------------------------------------
// Swagger / OpenAPI
// -----------------------------------------------------------------------------

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
    "v1",
    new Microsoft.OpenApi.OpenApiInfo
    {
        Title = "TicketingSystem API",
        Version = "v1",
        Description = "Support Ticket Management System API."
    });


// -------------------------------------------------------------------------
// JWT Bearer security definition
// -------------------------------------------------------------------------

options.AddSecurityDefinition(
    "Bearer",
    new Microsoft.OpenApi.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.ParameterLocation.Header,
        Description =
            "Enter your JWT access token. Swagger will send it as: " +
            "Authorization: Bearer {token}"
    });

    // -------------------------------------------------------------------------
    // JWT Bearer security requirement
    // -------------------------------------------------------------------------

    options.AddSecurityRequirement(
        document => new Microsoft.OpenApi.OpenApiSecurityRequirement
        {
            [
                new Microsoft.OpenApi.OpenApiSecuritySchemeReference(
                    "Bearer",
                    document)
            ] = []
        });


});

// -----------------------------------------------------------------------------
// Infrastructure
// -----------------------------------------------------------------------------

// Registers the application's Infrastructure services.
//
// This includes:
//
// - Entity Framework Core
// - SQL Server
// - ASP.NET Core Identity
// - JWT Bearer authentication
// - Authorization
// - IdentityService
// - JwtTokenService
//
builder.Services.AddInfrastructure(builder.Configuration);

// -----------------------------------------------------------------------------
// Application services
// -----------------------------------------------------------------------------

// Registers the application-level authentication service.
builder.Services.AddScoped<AuthenticationService>();

// =============================================================================
// BUILD APPLICATION
// =============================================================================

var app = builder.Build();

// =============================================================================
// GLOBAL EXCEPTION HANDLING
// =============================================================================

// IMPORTANT:
//
// WebApplication automatically adds the Developer Exception Page when the
// application is running in Development.
//
// That automatic middleware can catch exceptions before a middleware added
// later through UseMiddleware<T>() gets a chance to handle them.
//
// TicketingSystem uses its own GlobalExceptionHandlerMiddleware so that all
// API clients receive consistent JSON error responses.
//
// Therefore, explicitly disable the automatic Developer Exception Page by
// not calling app.UseDeveloperExceptionPage() and place the application's
// global exception middleware at the beginning of the explicit pipeline.
//
// The GlobalExceptionHandlerMiddleware converts:
//
//     UnauthorizedAccessException -> HTTP 403
//     KeyNotFoundException       -> HTTP 404
//     ArgumentException           -> HTTP 400
//     InvalidOperationException  -> HTTP 400
//     unexpected exception       -> HTTP 500
//
// For the customer status-change scenario this means the backend exception:
//
//     UnauthorizedAccessException:
//     "Customers cannot change ticket status."
//
// becomes:
//
//     HTTP 403 Forbidden
//
// with:
//
//     {
//         "type": "...",
//         "title": "Forbidden",
//         "status": 403,
//         "detail": "Customers cannot change ticket status."
//     }
//
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

// =============================================================================
// HTTP REQUEST PIPELINE
// =============================================================================

// -----------------------------------------------------------------------------
// Swagger
// -----------------------------------------------------------------------------

// Swagger is enabled during development so that the API can be tested
// independently of the Angular frontend.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// -----------------------------------------------------------------------------
// HTTPS
// -----------------------------------------------------------------------------

// Redirects HTTP requests to HTTPS.
app.UseHttpsRedirection();

// -----------------------------------------------------------------------------
// CORS
// -----------------------------------------------------------------------------

// Applies the AngularClient CORS policy.
//
// CORS is intentionally placed before authentication and authorization so
// browser preflight requests can be processed correctly.
app.UseCors("AngularClient");

// -----------------------------------------------------------------------------
// Authorization header diagnostic middleware
// -----------------------------------------------------------------------------

// This middleware is retained while troubleshooting JWT authentication.
//
// It only reports whether an Authorization header was received.
// It does not authenticate the request.
app.Use(async (context, next) =>
{
    var authorizationHeader =
    context.Request.Headers.Authorization.ToString();


Console.WriteLine(
    $"Authorization Header Received: " +
    $"{(string.IsNullOrWhiteSpace(authorizationHeader)
        ? "NO"
        : "YES")}");

    await next();


});

// -----------------------------------------------------------------------------
// Authentication
// -----------------------------------------------------------------------------

// Executes JWT Bearer authentication.
//
// This middleware validates the JWT and creates the authenticated
// ClaimsPrincipal when the token is valid.
app.UseAuthentication();

// -----------------------------------------------------------------------------
// Authorization
// -----------------------------------------------------------------------------

// Evaluates authorization requirements such as [Authorize].
app.UseAuthorization();

// -----------------------------------------------------------------------------
// Controllers
// -----------------------------------------------------------------------------

// Maps controller endpoints such as:
//
// POST /api/Auth/login
// GET  /api/Auth/me
// GET  /api/Tickets
// GET  /api/Tickets/{id}
// GET  /api/Tickets/{id}/details
// PATCH /api/Tickets/{id}/status
//
app.MapControllers();

// =============================================================================
// IDENTITY SEEDING
// =============================================================================

// Creates a scoped service provider and executes the Identity seed operation.
//
// This ensures that required initial roles and users are available when the
// application starts.
using (var scope = app.Services.CreateScope())
{
    await IdentitySeeder.SeedAsync(scope.ServiceProvider);
}

// =============================================================================
// START APPLICATION
// =============================================================================

// Starts the application and begins listening for HTTP requests.
app.Run();

// ============================================================================
// TEST HOST ACCESS
// ============================================================================
//
// WebApplicationFactory<TEntryPoint> requires the application's Program type
// to be publicly accessible from the integration-test assembly.
//
// This does not change the runtime behavior of the API.
//

public partial class Program
{
}
