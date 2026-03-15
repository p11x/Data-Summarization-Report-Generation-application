import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: any, state: RouterStateSnapshot): boolean | UrlTree {
    if (this.authService.isLoggedIn()) {
      return true;
    }
    
    // Store the attempted URL in AuthService for redirect after login
    this.authService.redirectUrl = state.url;
    console.log('AuthGuard: Storing redirect URL:', state.url);
    
    // Redirect to login page
    return this.router.createUrlTree(['/auth']);
  }
}