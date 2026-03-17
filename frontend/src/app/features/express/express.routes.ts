import { Routes } from '@angular/router';
import { ExpressPublicComponent } from './express-public.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { ExpressRequestComponent } from './express-request.component';
import { ExpressMyDeliveriesComponent } from './express-my-deliveries.component';
import { ExpressImportExportRequestComponent } from './express-import-export-request.component';
import { ExpressImportExportMyComponent } from './express-import-export-my.component';
import { ExpressPaymentComponent } from './express-payment.component';

export const EXPRESS_ROUTES: Routes = [
  { path: '', component: ExpressPublicComponent },
  { path: 'request', component: ExpressRequestComponent, canActivate: [AuthGuard] },
  { path: 'my-deliveries', component: ExpressMyDeliveriesComponent, canActivate: [AuthGuard] },
  { path: 'import-export/request', component: ExpressImportExportRequestComponent, canActivate: [AuthGuard] },
  { path: 'import-export/my', component: ExpressImportExportMyComponent, canActivate: [AuthGuard] },
  { path: 'payment/:deliveryId', component: ExpressPaymentComponent, canActivate: [AuthGuard] },
];
