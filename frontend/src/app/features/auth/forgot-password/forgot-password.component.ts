import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import {
  AuthService,
  PasswordResetRequestResponse,
} from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  devResetUrl: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;
    this.devResetUrl = null;

    this.authService
      .requestPasswordReset(this.form.getRawValue().email)
      .subscribe({
        next: (response: PasswordResetRequestResponse) => {
          this.loading = false;
          this.success = response.message;
          this.devResetUrl = response.devResetUrl ?? null;
        },
        error: (err) => {
          this.loading = false;
          const backendMessage =
            typeof err?.error?.message === 'string' ? err.error.message : null;
          this.error = backendMessage ?? 'Impossible de lancer la réinitialisation.';
        },
      });
  }

  openDevResetUrl(): void {
    if (!this.devResetUrl) return;
    const url = new URL(this.devResetUrl, window.location.origin);
    void this.router.navigateByUrl(`${url.pathname}${url.search}`);
  }
}
