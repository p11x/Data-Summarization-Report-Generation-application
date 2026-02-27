import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingComponent } from './loading/loading.component';

@Component({
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
    <app-loading></app-loading>
  `,
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterOutlet, LoadingComponent]
})
export class AppComponent {
  title = 'Angular Microservices App';
}
