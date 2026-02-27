import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class AuthComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;
  isLoginMode = true;
  registrationSuccess = false;
  
  constructor(private authService: AuthService, private router: Router, private fb: FormBuilder) {
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
  
  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.registrationSuccess = false;
  }
  
  async onLogin() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      const success = await this.authService.login(email, password);
      if (success) {
        this.router.navigate(['/home']);
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