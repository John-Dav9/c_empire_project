import { Routes } from '@angular/router';
import { ProfileComponent } from './profile.component';

export const PROFILE_ROUTES: Routes = [
  { path: 'me', component: ProfileComponent },
  { path: '', redirectTo: 'me', pathMatch: 'full' }
];
