using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace TicketingSystem.Api.Swagger;

/// <summary>
/// Adds the JWT Bearer security requirement to Swagger operations that are
/// protected by ASP.NET Core authorization.
/// </summary>
/// <remarks>
/// Swashbuckle.AspNetCore 10.x uses the newer Microsoft.OpenApi security
/// reference model. The security scheme reference must be associated with
/// the current OpenAPI document through <see cref="OperationFilterContext.Document"/>.
/// </remarks>
public sealed class AuthorizeCheckOperationFilter : IOperationFilter
{
    /// <summary>
    /// Applies the JWT Bearer security requirement to an OpenAPI operation
    /// when the corresponding API endpoint requires authorization.
    /// </summary>
    /// <param name="operation">
    /// The OpenAPI operation currently being generated.
    /// </param>
    /// <param name="context">
    /// The context containing API metadata and the current OpenAPI document.
    /// </param>
    public void Apply(
        OpenApiOperation operation,
        OperationFilterContext context)
    {
        // ---------------------------------------------------------------------
        // Check for [AllowAnonymous]
        // ---------------------------------------------------------------------
        //
        // An endpoint explicitly marked with [AllowAnonymous] must not require
        // authentication in Swagger, even if authorization metadata exists
        // elsewhere in its endpoint metadata.
        //
        var hasAllowAnonymous =
            context.ApiDescription.ActionDescriptor.EndpointMetadata
                .OfType<AllowAnonymousAttribute>()
                .Any();

        if (hasAllowAnonymous)
        {
            return;
        }

        // ---------------------------------------------------------------------
        // Check for [Authorize]
        // ---------------------------------------------------------------------
        //
        // Only operations protected by ASP.NET Core authorization should
        // receive the Bearer security requirement.
        //
        var hasAuthorize =
            context.ApiDescription.ActionDescriptor.EndpointMetadata
                .OfType<AuthorizeAttribute>()
                .Any();

        if (!hasAuthorize)
        {
            return;
        }

        // ---------------------------------------------------------------------
        // Create the Bearer security scheme reference
        // ---------------------------------------------------------------------
        //
        // IMPORTANT:
        //
        // With Swashbuckle.AspNetCore 10.x / Microsoft.OpenApi 2.x, the
        // OpenApiSecuritySchemeReference should be associated with the
        // current OpenAPI document.
        //
        // Omitting context.Document can result in Swagger generating an
        // empty security requirement such as:
        //
        //     "security": [
        //         {}
        //     ]
        //
        // instead of:
        //
        //     "security": [
        //         {
        //             "Bearer": []
        //         }
        //     ]
        //
        var bearerScheme =
            new OpenApiSecuritySchemeReference(
                "Bearer",
                context.Document);

        // ---------------------------------------------------------------------
        // Apply the security requirement
        // ---------------------------------------------------------------------
        //
        // JWT Bearer authentication does not use OAuth scopes, therefore the
        // required scope collection is intentionally empty.
        //
        operation.Security =
        [
            new OpenApiSecurityRequirement
            {
                [bearerScheme] = []
            }
        ];
    }
}