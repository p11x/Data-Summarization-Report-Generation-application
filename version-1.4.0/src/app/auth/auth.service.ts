import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Authentication Service
 * 
 * IMPORTANT: This is a placeholder implementation. Before production deployment:
 * - Integrate with a real authentication backend (OAuth, JWT, etc.)
 * - Implement proper password hashing (bcrypt, argon2, etc.)
 * - Use secure token storage (not localStorage for sensitive data)
 * - Add CSRF protection
 * - Implement account lockout after failed attempts
 * - Add multi-factor authentication
 */

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'currentUser';
  
  // Store redirect URL for after login
  redirectUrl: string | null = null;

  constructor(private router: Router) {
    this.currentUserSubject = new BehaviorSubject<any>(this.getStoredUser());
  }

  /**
   * Check if we're running in browser (not SSR)
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  /**
   * Get user from storage on service initialization
   */
  private getStoredUser(): any {
    if (!this.isBrowser()) {
      return null;
    }
    try {
      const user = localStorage.getItem(this.USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  /**
   * Authenticate user with credentials
   * 
   * NOTE: This is a MOCK implementation for demonstration purposes.
   * Replace with actual API call to authentication service.
   * 
   * @param username - User's username or email
   * @param password - User's password
   * @returns Promise<boolean> indicating success/failure
   */
  async login(username: string, password: string): Promise<boolean> {
    // Input validation
    if (!username || !password) {
      console.warn('Login attempt with missing credentials');
      return false;
    }

    try {
      // TODO: Replace with actual API call
      // const response = await this.http.post('/api/auth/login', { username, password }).toPromise();
      
      // MOCK: Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // MOCK: Accept any non-empty credentials (DEMO ONLY - REMOVE IN PRODUCTION)
      // In production, validate against backend
      const mockResponse = {
        username,
        token: this.generateMockToken(username),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      // Store token securely
      this.storeAuthData(mockResponse);
      
      this.currentUserSubject.next({ username });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  /**
   * Register a new user
   * 
   * NOTE: This is a MOCK implementation for demonstration purposes.
   * Replace with actual API call to registration service.
   * 
   * @param email - User's email address
   * @param password - User's password (should be hashed by backend)
   * @returns Promise<boolean> indicating success/failure
   */
  async register(email: string, password: string): Promise<boolean> {
    // Input validation
    if (!email || !password) {
      console.warn('Registration attempt with missing credentials');
      return false;
    }

    // Password strength validation
    if (password.length < 8) {
      console.warn('Registration failed: password too short');
      return false;
    }

    try {
      // TODO: Replace with actual API call
      // const response = await this.http.post('/api/auth/register', { email, password }).toPromise();
      
      // MOCK: Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // MOCK: Check if user exists (in real app, this is done server-side)
      const existingUsers = this.getStoredUsers();
      if (existingUsers.find((u: any) => u.email === email)) {
        return false;
      }

      // MOCK: Store user (in production, password should NEVER be stored locally)
      // NOTE: Storing any password in localStorage is insecure!
      // This is only for DEMO purposes
      const newUser = {
        email,
        // MOCK: Store token instead of password (proper approach)
        token: this.generateMockToken(email),
        createdAt: new Date().toISOString()
      };
      
      existingUsers.push(newUser);
      this.storeUsers(existingUsers);
      
      // Auto-login after registration
      this.storeAuthData({ username: email, token: newUser.token, expiresAt: Date.now() + (24 * 60 * 60 * 1000) });
      this.currentUserSubject.next({ username: email });
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  }

  /**
   * Logout current user
   */
  logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth']);
  }

  /**
   * Get current user observable
   */
  get currentUser(): Observable<any> {
    return this.currentUserSubject.asObservable();
  }

  /**
   * Check if user is currently logged in
   */
  isLoggedIn(): boolean {
    // Handle SSR - localStorage is not available on server
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return false;

    try {
      // Check if token is expired
      const userData = JSON.parse(localStorage.getItem(this.USER_KEY) || '{}');
      // In real implementation, decode JWT or check expiry
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    if (!this.isBrowser()) {
      return null;
    }
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Store authentication data
   */
  private storeAuthData(data: { username: string; token: string; expiresAt: number }): void {
    if (!this.isBrowser()) {
      return;
    }
    localStorage.setItem(this.TOKEN_KEY, data.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify({ 
      username: data.username,
      expiresAt: data.expiresAt
    }));
  }

  /**
   * Get stored users (for mock implementation)
   */
  private getStoredUsers(): any[] {
    if (!this.isBrowser()) {
      return [];
    }
    try {
      return JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Store users (for mock implementation)
   */
  private storeUsers(users: any[]): void {
    if (!this.isBrowser()) {
      return;
    }
    localStorage.setItem('registeredUsers', JSON.stringify(users));
  }

  /**
   * Generate mock token (for demo purposes only)
   * In production, use proper JWT or OAuth tokens
   */
  private generateMockToken(username: string): string {
    // This is a placeholder - in production use proper token generation
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return btoa(`${username}:${timestamp}:${random}`);
  }
}