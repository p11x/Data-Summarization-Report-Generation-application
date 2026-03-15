import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  bio: string;
  dateOfBirth: string;
  gender: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ProfileComponent implements OnInit {
  isEditing: boolean = false;
  profile: UserProfile = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    bio: '',
    dateOfBirth: '',
    gender: ''
  };

  originalProfile: UserProfile = { ...this.profile };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    // Load user profile from localStorage or service
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      this.profile = JSON.parse(savedProfile);
      this.originalProfile = { ...this.profile };
    } else {
      // Initialize with default values from auth service
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        this.profile.email = currentUser.email || '';
        this.profile.firstName = currentUser.username || '';
      }
    }
  }

  toggleEdit() {
    if (this.isEditing) {
      // Cancel editing - restore original values
      this.profile = { ...this.originalProfile };
    }
    this.isEditing = !this.isEditing;
  }

  saveProfile() {
    // Save profile to localStorage
    localStorage.setItem('userProfile', JSON.stringify(this.profile));
    this.originalProfile = { ...this.profile };
    this.isEditing = false;
    
    // Show success message (you could use a toast service here)
    console.log('Profile saved successfully');
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Handle profile picture upload
        console.log('Profile picture selected');
      };
      reader.readAsDataURL(input.files[0]);
    }
  }
}
