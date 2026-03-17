import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FooterConfigService } from '../../../core/services/footer-config.service';

@Component({
  selector: 'app-footer-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule],
  template: `
    <section class="page app-shell-card">
      <header class="head">
        <div>
          <h1>Configuration Footer</h1>
          <p>Pilotez tous les textes, liens et sections du footer depuis cette configuration JSON.</p>
        </div>
        <div class="actions">
          <button type="button" mat-stroked-button (click)="formatJson()">Formatter</button>
          <button type="button" mat-raised-button color="primary" (click)="save()" [disabled]="saving">
            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </header>

      <div class="status error" *ngIf="error">{{ error }}</div>
      <div class="status ok" *ngIf="success">{{ success }}</div>

      <form [formGroup]="form">
        <textarea formControlName="json" rows="28"></textarea>
      </form>
    </section>
  `,
  styles: [`
    .page { border:1px solid var(--line); padding:1rem; display:grid; gap:.8rem; }
    .head { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap; }
    h1 { margin:0; font-size:clamp(1.45rem,2.3vw,2rem); }
    p { margin:.35rem 0 0; color:var(--ink-2); max-width:760px; }
    .actions { display:flex; gap:.5rem; }
    textarea {
      width:100%;
      border:1px solid var(--line);
      border-radius:12px;
      background:#0f1724;
      color:#d8e3f2;
      font-family:Consolas, Monaco, monospace;
      font-size:.9rem;
      line-height:1.4;
      padding:.9rem;
      resize:vertical;
    }
    .status { border-radius:10px; padding:.6rem .7rem; font-weight:700; }
    .status.error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; }
    .status.ok { background:#eefbf7; border:1px solid #b9eadf; color:#0b6557; }
  `],
})
export class FooterSettingsComponent implements OnInit {
  form: ReturnType<FormBuilder['group']>;
  saving = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly footerConfigService: FooterConfigService,
  ) {
    this.form = this.fb.group({
      json: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.footerConfigService.getAdminConfig().subscribe({
      next: (data) => {
        this.form.patchValue({ json: JSON.stringify(data, null, 2) });
      },
      error: () => {
        this.error = 'Impossible de charger la configuration du footer.';
      },
    });
  }

  formatJson(): void {
    this.error = null;
    this.success = null;
    try {
      const value = JSON.parse(this.form.value.json || '{}');
      this.form.patchValue({ json: JSON.stringify(value, null, 2) });
    } catch {
      this.error = 'JSON invalide: impossible de formatter.';
    }
  }

  save(): void {
    this.error = null;
    this.success = null;
    let payload: Record<string, any>;
    try {
      payload = JSON.parse(this.form.value.json || '{}');
    } catch {
      this.error = 'JSON invalide: corrigez le contenu avant enregistrement.';
      return;
    }

    this.saving = true;
    this.footerConfigService.updateConfig(payload as any).subscribe({
      next: (saved) => {
        this.saving = false;
        this.success = 'Configuration footer mise a jour.';
        this.form.patchValue({ json: JSON.stringify(saved, null, 2) });
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'Echec de la sauvegarde de la configuration.';
      },
    });
  }
}
