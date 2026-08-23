using TicketingSystem.Application.Services;
using TicketingSystem.Infrastructure.DependencyInjection;
using TicketingSystem.Infrastructure.Seeding;

var builder = WebApplication.CreateBuilder(args);

// -----------------------------------------------------------------------------
// MVC / API
// -----------------------------------------------------------------------------

// Registers ASP.NET Core MVC controllers so that API controllers such as
// AuthController can be discovered and mapped to HTTP endpoints.
builder.Services.AddControllers();

// Registers API endpoint metadata required by Swagger/OpenAPI generation.
builder.Services.AddEndpointsApiExplorer();

// -----------------------------------------------------------------------------
// Swagger / OpenAPI
// -----------------------------------------------------------------------------

builder.Services.AddSwaggerGen(options =>
{
    // Defines the API document exposed by Swagger UI.
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
    //
    // This defines the authentication mechanism that Swagger UI will use when
    // sending JWT access tokens to the API.
    //
    // The resulting HTTP header will be:
    //
    //     Authorization: Bearer <JWT>
    //
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
    //
    // Swashbuckle.AspNetCore 10.x uses the OpenAPI document-aware security
    // scheme reference.
    //
    // We intentionally configure this through AddSecurityRequirement rather
    // than our previous OperationFilter.
    //
    // This ensures that Swagger UI receives a concrete security requirement
    // associated with the "Bearer" scheme and therefore knows that the token
    // entered through the Authorize dialog must be sent with API requests.
    //
    // The empty scope collection is correct because JWT Bearer authentication
    // does not use OAuth scopes.
    //
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

// Registers the application's Infrastructure services, including:
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

// Registers the application authentication service.
builder.Services.AddScoped<AuthenticationService>();

// -----------------------------------------------------------------------------
// Build application
// -----------------------------------------------------------------------------

var app = builder.Build();

// -----------------------------------------------------------------------------
// Swagger
// -----------------------------------------------------------------------------

// Swagger is enabled during development so that the API can be tested
// independently of the React frontend.
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
// Authorization header diagnostic middleware
// -----------------------------------------------------------------------------
//
// This middleware is intentionally retained while we troubleshoot the JWT
// authentication flow.
//
// It tells us whether the incoming HTTP request actually contains an
// Authorization header.
//
// IMPORTANT:
// This middleware does not authenticate the request. Authentication is still
// performed by ASP.NET Core's JWT Bearer authentication middleware below.
//
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
// This reads the Authorization header, validates the JWT signature, issuer,
// audience, and lifetime, and creates the authenticated ClaimsPrincipal.
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
// GET  /api/Auth/auth-debug
//
app.MapControllers();

// -----------------------------------------------------------------------------
// Identity seeding
// -----------------------------------------------------------------------------

// Creates a scoped service provider and executes the Identity seed operation.
//
// This ensures that required initial roles and users are available when the
// application starts.
using (var scope = app.Services.CreateScope())
{
    await IdentitySeeder.SeedAsync(scope.ServiceProvider);
}

// -----------------------------------------------------------------------------
// Start application
// -----------------------------------------------------------------------------

app.Run();