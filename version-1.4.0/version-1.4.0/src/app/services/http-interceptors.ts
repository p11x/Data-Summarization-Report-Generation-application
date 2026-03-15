/**
 * HTTP Interceptors (Functional Style for Angular 19+)
 * 
 * Handles common HTTP errors:
 * - 401 (Unauthorized) - redirect to login
 * - 403 (Forbidden) - show access denied message
 * - 500 (Server Error) - show appropriate error message
 * - Retry logic for transient failures
 */

import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retryWhen, delayWhen, take } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

/**
 * JWT Token Interceptor
 * Adds JWT token to outgoing requests
 */
export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const token = localStorage.getItem('currentUser');
  
  if (token) {
    try {
      const user = JSON.parse(token);
      if (user?.token) {
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${user.token}`
          }
        });
      }
    } catch (e) {
      // Invalid token in localStorage, ignore
    }
  }

  return next(req);
};

/**
 * HTTP Error Interceptor
 * Handles common HTTP errors and retry logic
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    retryWhen(errors =>
      errors.pipe(
        // Only retry for network errors or 5xx server errors
        delayWhen((error: HttpErrorResponse, index: number) => {
          const shouldRetry = 
            error.status === 0 || 
            error.status >= 500;
          
          if (shouldRetry && index < environment.retryAttempts) {
            const delayTime = Math.pow(2, index) * 1000; // Exponential backoff
            console.log(`Retrying request (attempt ${index + 1}) after ${delayTime}ms`);
            return timer(delayTime);
          }
          
          throw error;
        }),
        take(environment.retryAttempts)
      )
    ),
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 400:
            errorMessage = error.error?.message || 'Bad request. Please check your input.';
            break;
          case 401:
            // Unauthorized - redirect to login
            errorMessage = 'Your session has expired. Please log in again.';
            authService.logout();
            router.navigate(['/auth']);
            break;
          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = error.error?.message || 'The requested resource was not found.';
            break;
          case 408:
            errorMessage = 'Request timeout. Please try again.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later or contact support.';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = error.error?.message || `Error: ${error.status} - ${error.statusText}`;
        }
      }

      // Log error in development
      if (environment.enableDebugMode) {
        console.error('HTTP Error:', {
          status: error.status,
          message: errorMessage,
          url: error.url,
          error: error.error
        });
      }

      // Return error with user-friendly message
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        originalError: error
      }));
    })
  );
};

// Export type for HTTP events
import { HttpEvent } from '@angular/common/http';
