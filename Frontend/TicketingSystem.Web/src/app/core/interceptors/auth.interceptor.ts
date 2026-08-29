import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**

* ============================================================================
* TicketingSystem - Authentication HTTP Interceptor
* ============================================================================
*
* Responsible for:
*
* * Attaching the JWT access token to authenticated API requests.
* * Leaving unauthenticated requests unchanged.
* * Normalizing API error responses so Angular components can reliably read
* backend error messages.
*
* IMPORTANT:
*
* ASP.NET Core authorization failures such as HTTP 401 and HTTP 403 do not
* necessarily throw an exception inside the API application code.
*
* For example, an [Authorize] attribute can reject a request before the
* controller executes.
*
* Therefore the GlobalExceptionHandlerMiddleware cannot handle every 401/403.
*
* This interceptor preserves those HTTP errors while ensuring that the
* frontend always has a meaningful error object/message available.
* ============================================================================
  */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  /**

  * Retrieve the JWT stored by AuthService after successful login.
    */
  const accessToken = localStorage.getItem('ticketing_access_token');

  /**
  
  * If no access token exists, send the request unchanged.
  *
  * This is required for unauthenticated endpoints such as:
  *
  * POST /api/Auth/login
    */
  const authenticatedRequest = accessToken
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    : request;

  /**
  
  * Continue the HTTP request pipeline.
  *
  * catchError is intentionally placed here so that all API errors can be
  * normalized consistently before they reach individual components.
    */
  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      /**
    
      * Preserve the original HttpErrorResponse.
      *
      * Angular components can still inspect:
      *
      * * error.status
      * * error.error
      * * error.message
      *
      * We only ensure that error.error contains a useful message when the
      * server returned an empty 401/403 response.
        */
      if (error instanceof HttpErrorResponse) {
        /**
    
        * ASP.NET Core authorization middleware may return an empty 401/403.
        *
        * In that case Angular has no backend "detail" property to display.
        * Provide a safe client-side fallback.
          */
        if (
          (error.status === 401 || error.status === 403) &&
          (!error.error ||
            (typeof error.error === 'object' &&
              !error.error.detail &&
              !error.error.message &&
              !error.error.title))
        ) {
          const message =
            error.status === 401
              ? 'Your session has expired or you are not authenticated.'
              : 'You do not have permission to perform this operation.';

          const normalizedError = new HttpErrorResponse({
            error: {
              title: error.status === 401 ? 'Unauthorized' : 'Forbidden',
              status: error.status,
              detail: message,
              message,
            },
            headers: error.headers,
            status: error.status,
            statusText: error.statusText,
            url: error.url ?? undefined,
          });

          return throwError(() => normalizedError);
        }

        /**
         * Handle a backend ProblemDetails response that arrives as a string.
         *
         * This can occur in some browser/server/content-type combinations.
         *
         * Attempt to parse the JSON so components can reliably access:
         *
         * error.error.detail
         */
        if (typeof error.error === 'string' && error.error.trim().length > 0) {
          try {
            const parsedError = JSON.parse(error.error);

            const normalizedError = new HttpErrorResponse({
              error: parsedError,
              headers: error.headers,
              status: error.status,
              statusText: error.statusText,
              url: error.url ?? undefined,
            });

            return throwError(() => normalizedError);
          } catch {
            /**
             * The response was plain text rather than JSON.
             *
             * Preserve the original response because its message may still
             * be useful to the calling component.
             */
          }
        }
      }

      /**
      
        * Preserve all other errors unchanged.
          */
      return throwError(() => error);
    }),
  );
};
