import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '../models/api-types';
import { User } from '../models/user';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly url = '/auth/login';

  login(email: string, password: string): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(this.url, {
      user: { email, password },
    });
  }
}
