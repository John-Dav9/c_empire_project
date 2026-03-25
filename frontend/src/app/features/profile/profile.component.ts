import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatar: string | null;
}

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="profile-page">
      <div class="profile-header">
        <div class="avatar-wrapper">
          <div class="avatar" [attr.aria-label]="'Avatar de ' + displayName()">
            @if (profile()?.avatar) {
              <img [src]="profile()!.avatar" [alt]="'Avatar de ' + displayName()" />
            } @else {
              <span class="avatar-initials">{{ initials() }}</span>
            }
          </div>
        </div>
        <div class="header-info">
          <h1>{{ displayName() }}</h1>
          <p class="user-email">{{ user()?.email }}</p>
          <span class="role-badge">{{ roleLabel() }}</span>
        </div>
      </div>

      <mat-divider />

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40" />
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Prénom</mat-label>
              <input matInput formControlName="firstName" placeholder="Votre prénom" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Nom</mat-label>
              <input matInput formControlName="lastName" placeholder="Votre nom" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Téléphone</mat-label>
              <input matInput formControlName="phone" placeholder="+237 6XX XXX XXX" />
              <mat-icon matSuffix>phone</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Adresse e-mail</mat-label>
              <input matInput [value]="user()?.email ?? ''" readonly />
              <mat-icon matSuffix>lock</mat-icon>
              <mat-hint>L'e-mail ne peut pas être modifié</mat-hint>
            </mat-form-field>
          </div>

          @if (error()) {
            <p class="error-msg" role="alert">{{ error() }}</p>
          }

          <div class="form-actions">
            <button
              mat-flat-button
              type="submit"
              class="save-btn"
              [disabled]="saving() || form.invalid || form.pristine"
            >
              @if (saving()) {
                <mat-spinner diameter="18" />
              } @else {
                <mat-icon>save</mat-icon>
              }
              Enregistrer
            </button>
          </div>
        </form>
      }

      <mat-divider />

      <div class="danger-zone">
        <h2>Sécurité</h2>
        <p>Pour modifier votre mot de passe, utilisez la procédure de réinitialisation.</p>
        <a mat-stroked-button routerLink="/auth/forgot-password" class="reset-btn">
          <mat-icon>lock_reset</mat-icon>
          Réinitialiser le mot de passe
        </a>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      max-width: 720px;
      margin: 2rem auto;
      padding: 0 1rem 4rem;
    }
    .profile-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .avatar-wrapper {
      flex-shrink: 0;
    }
    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      overflow: hidden;
      background: #c62828;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .avatar-initials {
      font-size: 1.75rem;
      font-weight: 700;
      color: white;
    }
    .header-info h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 0.25rem;
      color: #1a1a2e;
    }
    .user-email {
      color: #666;
      margin: 0 0 0.5rem;
      font-size: 0.9rem;
    }
    .role-badge {
      display: inline-block;
      padding: 0.2rem 0.75rem;
      background: #fce4ec;
      color: #c62828;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    mat-divider {
      margin: 2rem 0;
    }
    .loading-state {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 1.5rem;
    }
    mat-form-field {
      width: 100%;
    }
    .error-msg {
      color: #c62828;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }
    .save-btn {
      background-color: #c62828;
      color: white;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .danger-zone h2 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 0.5rem;
    }
    .danger-zone p {
      color: #666;
      margin-bottom: 1rem;
    }
    .reset-btn {
      border-color: #c62828;
      color: #c62828;
    }
    @media (max-width: 600px) {
      .profile-header { flex-direction: column; text-align: center; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly user = signal(this.auth.getCurrentUser());
  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    firstName: [''],
    lastName: [''],
    phone: [''],
  });

  readonly displayName = () => {
    const p = this.profile();
    const first = p?.firstName ?? '';
    const last = p?.lastName ?? '';
    const name = [first, last].filter(Boolean).join(' ');
    return name || this.user()?.email?.split('@')[0] || 'Mon profil';
  };

  readonly initials = () => {
    const p = this.profile();
    const first = p?.firstName?.[0]?.toUpperCase() ?? '';
    const last = p?.lastName?.[0]?.toUpperCase() ?? '';
    return first + last || this.user()?.email?.[0]?.toUpperCase() || '?';
  };

  readonly roleLabel = () => {
    const roles: Record<string, string> = {
      super_admin: 'Super Admin',
      admin: 'Administrateur',
      employee: 'Employé',
      client: 'Client',
    };
    return roles[this.user()?.role ?? ''] ?? 'Client';
  };

  ngOnInit(): void {
    this.api.get<UserProfile>('/profiles/me').subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.form.patchValue({
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          phone: profile.phone ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (this.form.invalid || this.form.pristine) return;
    this.saving.set(true);
    this.error.set(null);

    this.api.patch<UserProfile>('/profiles/me', this.form.value).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.form.markAsPristine();
        this.saving.set(false);
        this.snackBar.open('Profil mis à jour avec succès', 'OK', { duration: 3000 });
      },
      error: () => {
        this.error.set('Une erreur est survenue. Veuillez réessayer.');
        this.saving.set(false);
      },
    });
  }
}
