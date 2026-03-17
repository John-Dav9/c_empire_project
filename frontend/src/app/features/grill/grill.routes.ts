import { Routes } from '@angular/router';
import { GrillPublicComponent } from './grill-public.component';
import { GrillCheckoutComponent } from './grill-checkout.component';

export const GRILL_ROUTES: Routes = [
  { path: '', component: GrillPublicComponent },
  { path: 'checkout', component: GrillCheckoutComponent },
];
