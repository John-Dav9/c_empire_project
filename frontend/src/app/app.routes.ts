import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { AuthGuard } from './core/guards/auth.guard';
import { SigninComponent } from './features/auth/signin/signin.component';
import { SignupComponent } from './features/auth/signup/signup.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { HomeComponent } from './features/home/home.component';
import { ProductListComponent } from './features/shop/product-list/product-list.component';
import { ProductDetailComponent } from './features/shop/product-detail/product-detail.component';
import { CartComponent } from './features/shop/cart/cart.component';
import { PaymentComponent } from './features/payments/payment/payment.component';
import { ContentPageComponent } from './features/content/content-page.component';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      { path: 'signin', component: SigninComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
      { path: '', redirectTo: 'signin', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      {
        path: 'shop',
        children: [
          { path: '', component: ProductListComponent },
          { path: 'product/:id', component: ProductDetailComponent },
          { path: 'cart', component: CartComponent, canActivate: [AuthGuard] }
        ]
      },
      {
        path: 'payments',
        canActivate: [AuthGuard],
        children: [
          { path: 'checkout', component: PaymentComponent }
        ]
      },
      {
        path: 'grill',
        loadChildren: () => import('./features/grill/grill.routes').then(m => m.GRILL_ROUTES)
      },
      {
        path: 'express',
        loadChildren: () => import('./features/express/express.routes').then(m => m.EXPRESS_ROUTES)
      },
      {
        path: 'clean',
        loadChildren: () => import('./features/clean/clean.routes').then(m => m.CLEAN_ROUTES)
      },
      {
        path: 'events',
        loadChildren: () => import('./features/events/events.routes').then(m => m.EVENTS_ROUTES)
      },
      {
        path: 'todo',
        loadChildren: () => import('./features/todo/todo.routes').then(m => m.TODO_ROUTES)
      },
      {
        path: 'profile',
        canActivate: [AuthGuard],
        loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES)
      },
      { path: 'a-propos', component: ContentPageComponent, data: { slug: 'a-propos' } },
      { path: 'nos-missions', component: ContentPageComponent, data: { slug: 'nos-missions' } },
      { path: 'faq', component: ContentPageComponent, data: { slug: 'faq' } },
      {
        path: 'politique-confidentialite',
        component: ContentPageComponent,
        data: { slug: 'politique-confidentialite' },
      },
      {
        path: 'politique-cookies',
        component: ContentPageComponent,
        data: { slug: 'politique-cookies' },
      },
      {
        path: 'devenir-partenaire',
        component: ContentPageComponent,
        data: { slug: 'devenir-partenaire' },
      },
      {
        path: 'partenaires-confiance',
        component: ContentPageComponent,
        data: { slug: 'partenaires-confiance' },
      },
      { path: 'careers', component: ContentPageComponent, data: { slug: 'careers' } },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes)
      },
      {
        path: 'client',
        loadChildren: () => import('./features/client/client.routes').then(m => m.clientRoutes)
      },
      {
        path: 'employee',
        loadChildren: () => import('./features/employee/employee.routes').then(m => m.employeeRoutes)
      },
      {
        path: 'super-admin',
        loadChildren: () => import('./features/super-admin/super-admin.routes').then(m => m.superAdminRoutes)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
