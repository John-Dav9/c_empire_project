import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading = false;
  validating = true;
  tokenValid = false;
  error: string | null = null;
  success: string | null = null;
  hidePassword = true;
  hidePasswordConfirmation = true;
  private token = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: [
          (group) => {
            const password = group.get('password')?.value;
            const confirmPassword = group.get('confirmPassword')?.value;
            return password === confirmPassword
              ? null
              : { passwordMismatch: true };
          },
        ],
      },
    );
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.validating = false;
      this.error = 'Lien de réinitialisation invalide.';
      return;
    }

    this.authService.validateResetPasswordToken(this.token).subscribe({
      next: ({ valid }) => {
        this.validating = false;
        this.tokenValid = valid;
        if (!valid) {
          this.error = 'Ce lien est invalide ou expiré.';
        }
      },
      error: () => {
        this.validating = false;
        this.error = 'Impossible de vérifier ce lien pour le moment.';
      },
    });
  }

  onSubmit(): void {
    if (!this.tokenValid || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    this.authService
      .resetPassword(this.token, this.form.getRawValue().password)
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.success = response.message;
          this.form.disable();
          setTimeout(() => {
            void this.router.navigate(['/auth/signin']);
          }, 1600);
        },
        error: (err) => {
          this.loading = false;
          const backendMessage =
            typeof err?.error?.message === 'string' ? err.error.message : null;
          this.error =
            backendMessage ?? 'Impossible de réinitialiser le mot de passe.';
        },
      });
  }
}
