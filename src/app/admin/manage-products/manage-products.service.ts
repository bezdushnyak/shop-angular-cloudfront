import { Injectable, Injector } from '@angular/core';
import { EMPTY, Observable, catchError, throwError } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { switchMap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class ManageProductsService extends ApiService {
  constructor(injector: Injector) {
    super(injector);
  }

  uploadProductsCSV(file: File): Observable<unknown> {
    if (!this.endpointEnabled('import')) {
      console.warn(
        'Endpoint "import" is disabled. To enable change your environment.ts config'
      );
      return EMPTY;
    }

    return this.getPreSignedUrl(file.name).pipe(
      catchError((e: unknown) => this.handleError(e)),
      switchMap((url) =>
        this.http.put(url, file, {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'text/csv',
          },
        })
      )
    );
  }

  private handleError(error: unknown) {
    const httpResponseError = error as HttpErrorResponse;

    let errorMessage = '';
    switch (httpResponseError.status) {
      case 401:
        errorMessage = 'Authorization header is not set';
        break;
      case 403:
        errorMessage = 'Access denied, authorization header is not valid';
        break;
    }

    if (errorMessage) {
      alert(errorMessage);
    }

    return throwError(() => new Error(httpResponseError.message));
  }

  private getPreSignedUrl(fileName: string): Observable<string> {
    const url = this.getUrl('import', 'import');

    const authToken: string | null = localStorage.getItem(
      'authorization_token'
    );

    const headers: Record<string, string> = {};
    if (authToken) {
      headers.Authorization = `Basic ${localStorage.getItem(
        'authorization_token'
      )}`;
    }

    return this.http.get<string>(url, {
      params: {
        name: fileName,
      },
      headers,
    });
  }
}
