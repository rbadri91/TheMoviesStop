import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

/**
 * The Express backend resolves TMDB API responses as raw strings and calls
 * res.json(stringValue), which double-encodes the JSON. Angular's HttpClient
 * parses the outer JSON and returns a JS string. This interceptor detects that
 * and re-parses, so all services receive plain objects as expected.
 *
 * The /allFeeds endpoint is unaffected — it correctly parses before sending.
 */
export const jsonParseInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse && typeof event.body === 'string') {
        try {
          return event.clone({ body: JSON.parse(event.body) });
        } catch {
          return event;
        }
      }
      return event;
    })
  );
};
