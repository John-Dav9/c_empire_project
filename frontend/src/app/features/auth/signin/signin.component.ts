import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    RouterLink
  ],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss'
})
export class SigninComponent {
  form: FormGroup;
  loading = false;
  error: string | null = null;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  private getRedirectPath(role: string | undefined): string {
    const normalized = (role ?? '').toLowerCase().trim();
    switch (normalized) {
      case 'super_admin':
        return '/super-admin/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'employee':
        return '/employee/dashboard';
      case 'client':
      default:
        return '/client/dashboard';
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = null;

    const { email, password } = this.form.value;
    this.authService.signin(email, password).subscribe({
      next: async (response) => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const roleTargetPath = this.getRedirectPath(response.user?.role);
        const targetPath =
          returnUrl && returnUrl.startsWith('/') ? returnUrl : roleTargetPath;
        try {
          const navigated = await this.router.navigateByUrl(targetPath);
          if (!navigated) {
            this.error = 'Connexion réussie, mais redirection impossible.';
          }
        } finally {
          this.loading = false;
        }
      },
      error: (err) => {
        this.loading = false;
        const backendMessage =
          typeof err?.error?.message === 'string' ? err.error.message : null;

        if (err?.status === 401) {
          this.error = backendMessage ?? 'Identifiants invalides.';
          return;
        }

        if (err?.status === 0) {
          this.error = 'API indisponible. Vérifie que le backend tourne sur le port 3000.';
          return;
        }

        this.error = backendMessage ?? 'Erreur lors de la connexion';
      }
    });
  }

  goToSignup(): void {
    this.router.navigate(['/auth/signup']);
  }
}
