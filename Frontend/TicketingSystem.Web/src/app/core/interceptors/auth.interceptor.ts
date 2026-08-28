import { HttpInterceptorFn } from '@angular/common/http';

/**
 * HTTP interceptor responsible for attaching the JWT access token
 * to authenticated API requests.
 *
 * Whenever an access token exists in localStorage, the interceptor
 * adds the following HTTP header:
 *
 * Authorization: Bearer <JWT>
 *
 * This allows ASP.NET Core's JWT Bearer authentication middleware
 * to authenticate requests made by the Angular application.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  /**
   * Retrieve the JWT stored by AuthService after successful login.
   */
  const accessToken = localStorage.getItem('ticketing_access_token');

  /**
   * If there is no token, the request is sent unchanged.
   *
   * This is important for endpoints such as:
   *
   * POST /api/Auth/login
   *
   * because the user does not have a token yet when logging in.
   */
  if (!accessToken) {
    return next(request);
  }

  /**
   * HttpRequest instances are immutable.
   *
   * Therefore we create a cloned request with the Authorization
   * header added rather than modifying the original request.
   */
  const authenticatedRequest = request.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  /**
   * Continue the HTTP request pipeline with the authenticated request.
   */
  return next(authenticatedRequest);
};
