import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {
  LoginCredentials,
  RegisterCredentials,
  ChangePasswordRequest,
  AuthResponse,
  JwtPayload,
} from '../../models/auth.model';

const TOKEN_KEY = 'moviestop-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _token = signal<string | null>(
    localStorage.getItem(TOKEN_KEY)
  );

  readonly isLoggedIn = computed(() => {
    const token = this._token();
    if (!token) return false;
    const payload = this._decodePayload(token);
    return !!payload && payload.exp > Date.now() / 1000;
  });

  readonly currentUser = computed<string | null>(() => {
    const token = this._token();
    if (!token || !this.isLoggedIn()) return null;
    return this._decodePayload(token)?.username ?? null;
  });

  readonly currentUserId = computed<string | null>(() => {
    const token = this._token();
    if (!token || !this.isLoggedIn()) return null;
    return this._decodePayload(token)?._id ?? null;
  });

  constructor(private http: HttpClient) {}

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/login', credentials)
      .pipe(tap((res) => this._saveToken(res.token)));
  }

  register(credentials: RegisterCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/register', credentials)
      .pipe(tap((res) => this._saveToken(res.token)));
  }

  changePassword(payload: ChangePasswordRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/user/change-password', payload)
      .pipe(tap((res) => this._saveToken(res.token)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
  }

  getToken(): string | null {
    return this._token();
  }

  private _saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
  }

  private _decodePayload(token: string): JwtPayload | null {
    try {
      const base64 = token.split('.')[1];
      return JSON.parse(atob(base64)) as JwtPayload;
    } catch {
      return null;
    }
  }
}
