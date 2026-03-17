import { Routes } from '@angular/router';
import { CleanPublicComponent } from './clean-public.component';
import { CleanQuoteRequestComponent } from './clean-quote-request.component';
import { CleanBookingRequestComponent } from './clean-booking-request.component';
import { CleanBookingDetailComponent } from './clean-booking-detail.component';
import { AuthGuard } from '../../core/guards/auth.guard';

export const CLEAN_ROUTES: Routes = [
  { path: '', component: CleanPublicComponent },
  { path: 'quote', component: CleanQuoteRequestComponent },
  { path: 'book', component: CleanBookingRequestComponent },
  { path: 'booking/:id', component: CleanBookingDetailComponent, canActivate: [AuthGuard] },
];
