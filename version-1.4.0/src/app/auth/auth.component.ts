import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class AuthComponent implements OnInit {
  loginForm: FormGroup;
  registerForm: FormGroup;
  isLoginMode = true;
  registrationSuccess = false;
  redirectUrl: string = '';
  
  constructor(
    private authService: AuthService, 
    private router: Router, 
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }
  
  ngOnInit() {
    // Get the redirect URL from AuthService (set by AuthGuard)
    // Fall back to query params for backwards compatibility
    this.route.queryParams.subscribe(params => {
      if (!this.authService.redirectUrl && params['redirect']) {
        this.redirectUrl = params['redirect'];
      }
    });
    
    // Use the redirectUrl from AuthService if available
    if (this.authService.redirectUrl) {
      this.redirectUrl = this.authService.redirectUrl;
    }
    
    console.log('AuthComponent: redirectUrl:', this.redirectUrl);
  }
  
  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.registrationSuccess = false;
  }
  
  async onLogin() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      const success = await this.authService.login(email, password);
      if (success) {
        // Use redirectUrl from AuthService (set by AuthGuard) or fallback to component's redirectUrl
        const redirect = this.authService.redirectUrl || this.redirectUrl;
        console.log('AuthComponent: Login success, redirecting to:', redirect);
        
        // Clear the redirect URL after use
        this.authService.redirectUrl = null;
        
        if (redirect) {
          this.router.navigateByUrl(redirect);
        } else {
          this.router.navigate(['/home']);
        }
      }
    }
  }
  
  async onRegister() {
    if (this.registerForm.valid) {
      const { email, password, confirmPassword } = this.registerForm.value;
      
      if (password !== confirmPassword) {
        this.registerForm.setErrors({ mismatch: true });
        return;
      }
      
      const success = await this.authService.register(email, password);
      if (success) {
        this.registrationSuccess = true;
        this.isLoginMode = true;
        this.loginForm.patchValue({ email, password: '' });
      }
    }
  }
}