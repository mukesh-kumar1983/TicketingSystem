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
// This allows controllers such as AuthController to be discovered and exposed
// as HTTP API endpoints.
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
//
// Without this configuration, the browser sends a preflight OPTIONS request
// before certain API requests and rejects the response when the API does not
// return the appropriate Access-Control-Allow-Origin header.
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AngularClient",
        policy =>
        {
            policy
                // Allows requests originating from the Angular development
                // application.
                .WithOrigins("http://localhost:4200")

                // Allows Angular to send headers such as Content-Type and
                // Authorization.
                .AllowAnyHeader()

                // Allows HTTP methods such as GET, POST, PUT and DELETE.
                .AllowAnyMethod();
        });
});

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
    // Defines JWT Bearer authentication for Swagger UI.
    //
    // Swagger will send the token using:
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
    // This associates the Bearer security scheme with the generated API
    // document so that Swagger UI sends the JWT entered through its
    // Authorize dialog with protected API requests.
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
//
// AuthenticationService is responsible for authenticating users and
// generating the LoginResponse containing the JWT access token.
builder.Services.AddScoped<AuthenticationService>();


// =============================================================================
// BUILD APPLICATION
// =============================================================================

var app = builder.Build();


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

// Applies the AngularClient CORS policy to incoming HTTP requests.
//
// IMPORTANT:
//
// UseCors must be placed in the HTTP request pipeline before authentication
// and authorization so that browser preflight requests (OPTIONS) can be
// processed correctly.
//
// This is what allows:
//
//     http://localhost:4200
//
// to communicate with:
//
//     https://localhost:7223
//
app.UseCors("AngularClient");

// -----------------------------------------------------------------------------
// Authorization header diagnostic middleware
// -----------------------------------------------------------------------------

// This middleware is intentionally retained while we troubleshoot the JWT
// authentication flow.
//
// It tells us whether the incoming HTTP request contains an Authorization
// header.
//
// IMPORTANT:
//
// This middleware does NOT authenticate the request.
//
// Actual JWT authentication is performed later by UseAuthentication().
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
// This middleware reads the Authorization header, validates the JWT signature,
// issuer, audience and lifetime, and creates the authenticated
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
// GET  /api/Auth/auth-debug
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

// Starts the ASP.NET Core application and begins listening for HTTP requests.
app.Run();