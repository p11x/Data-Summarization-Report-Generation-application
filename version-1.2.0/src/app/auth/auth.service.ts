import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;

  constructor(private router: Router) {
    this.currentUserSubject = new BehaviorSubject<any>(null);
  }

  login(username: string, password: string): boolean {
    // ⚠️ WARNING: This is a mock authentication for demo purposes only.
    // TODO: Replace with real authentication before production deployment.
    // This accepts any non-empty credentials and should NOT be used in production.
    if (username && password) {
      const user = { username };
      this.currentUserSubject.next(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  }

  register(email: string, password: string): boolean {
    // ⚠️ WARNING: This is a mock registration for demo purposes only.
    // TODO: Replace with real registration before production deployment.
    if (email && password) {
      // Store user in localStorage (mock database)
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const existingUser = users.find((u: any) => u.email === email);
      
      if (existingUser) {
        return false; // User already exists
      }
      
      users.push({ email, password });
      localStorage.setItem('registeredUsers', JSON.stringify(users));
      return true;
    }
    return false;
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth']);
  }

  get currentUser(): Observable<any> {
    return this.currentUserSubject.asObservable();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('currentUser');
  }
}