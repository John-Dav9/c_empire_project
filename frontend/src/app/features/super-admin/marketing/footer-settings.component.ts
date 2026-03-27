import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FooterConfigService } from '../../../core/services/footer-config.service';
import { FooterConfig } from '../../../shared/footer/footer-config.model';

type FooterTab = 'columns' | 'promo' | 'app' | 'badges' | 'legal';

@Component({
  selector: 'app-footer-settings',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="crm-page">

      <!-- Header -->
      <div class="page-header">
        <div class="page-title">
          <h1>Footer du site</h1>
          <p>Gérez visuellement tous les contenus du pied de page.</p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-outline" (click)="reloadConfig()">↺ Recharger</button>
          <button type="button" class="btn btn-primary" (click)="save()" [disabled]="saving()">
            @if (saving()) { Enregistrement... } @else { Enregistrer }
          </button>
        </div>
      </div>

      @if (error()) {
        <div class="alert alert-error" role="alert">⚠️ {{ error() }}</div>
      }
      @if (success()) {
        <div class="alert alert-success" role="alert">✅ {{ success() }}</div>
      }

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner-ring"></div>
          <span>Chargement de la configuration...</span>
        </div>
      } @else {

        <!-- Tabs -->
        <nav class="tab-nav" aria-label="Sections du footer">
          @for (tab of tabs; track tab.id) {
            <button
              type="button"
              class="tab-btn"
              [class.active]="activeTab() === tab.id"
              (click)="activeTab.set(tab.id)"
            >
              <span class="tab-icon">{{ tab.icon }}</span>
              {{ tab.label }}
            </button>
          }
        </nav>

        <form [formGroup]="form" class="tab-body">

          <!-- ─── COLONNES ─── -->
          @if (activeTab() === 'columns') {
            <div class="section">
              <div class="section-head">
                <div>
                  <h2>Colonnes de navigation</h2>
                  <p>Structurez les liens du footer en colonnes thématiques.</p>
                </div>
                <button type="button" class="btn btn-add" (click)="addColumn()">+ Colonne</button>
              </div>
              <div formArrayName="columns" class="columns-grid">
                @for (col of columnsArray.controls; track $index; let ci = $index) {
                  <div class="col-card" [formGroupName]="ci">
                    <div class="col-card-header">
                      <input formControlName="title" class="input-title" placeholder="Titre de la colonne" />
                      <button type="button" class="icon-btn danger" (click)="removeColumn(ci)" aria-label="Supprimer la colonne">🗑</button>
                    </div>
                    <div formArrayName="links" class="links-list">
                      @for (link of getLinksArray(ci).controls; track $index; let li = $index) {
                        <div class="link-row" [formGroupName]="li">
                          <input formControlName="label" class="input-sm" placeholder="Libellé" />
                          <input formControlName="url" class="input-sm input-url" placeholder="URL" />
                          <button type="button" class="icon-btn-sm danger" (click)="removeLink(ci, li)" aria-label="Supprimer le lien">×</button>
                        </div>
                      }
                    </div>
                    <button type="button" class="btn-add-link" (click)="addLink(ci)">+ Lien</button>
                  </div>
                }
              </div>
            </div>
          }

          <!-- ─── CARTE PROMO ─── -->
          @if (activeTab() === 'promo') {
            <div class="section" formGroupName="promoCard">
              <div class="section-head">
                <div>
                  <h2>Carte promotionnelle</h2>
                  <p>Bloc mis en avant dans le footer pour une offre spéciale.</p>
                </div>
              </div>
              <div class="form-grid-2">
                <label class="field">
                  <span class="field-label">Titre de la carte</span>
                  <input formControlName="title" placeholder="Ex: Téléchargez l'application" />
                </label>
                <label class="field">
                  <span class="field-label">Libellé du bouton CTA</span>
                  <input formControlName="buttonLabel" placeholder="Ex: Télécharger maintenant" />
                </label>
                <label class="field">
                  <span class="field-label">URL du bouton</span>
                  <input formControlName="buttonUrl" placeholder="https://..." />
                </label>
                <label class="field">
                  <span class="field-label">URL de l'image</span>
                  <input formControlName="imageUrl" placeholder="https://..." />
                </label>
              </div>
            </div>
          }

          <!-- ─── APP & RÉSEAUX ─── -->
          @if (activeTab() === 'app') {
            <div class="section" formGroupName="appSection">
              <div class="section-head">
                <div>
                  <h2>Application & Réseaux sociaux</h2>
                  <p>Liens vers les stores et les profils sociaux.</p>
                </div>
              </div>
              <div class="form-grid-2">
                <label class="field">
                  <span class="field-label">Titre de la section</span>
                  <input formControlName="title" placeholder="Ex: C'EMPIRE sur mobile" />
                </label>
                <label class="field">
                  <span class="field-label">Titre réseaux sociaux</span>
                  <input formControlName="socialTitle" placeholder="Ex: Suivez-nous" />
                </label>
              </div>

              <div class="subsection">
                <div class="subsection-head">
                  <h3>Fonctionnalités mises en avant</h3>
                  <button type="button" class="btn-add-sm" (click)="addFeature()">+ Ajouter</button>
                </div>
                <div formArrayName="features" class="pill-list">
                  @for (feat of appFeaturesArray.controls; track $index; let fi = $index) {
                    <div class="pill-item">
                      <input [formControlName]="fi" class="input-sm" placeholder="Ex: Commande en 3 clics" />
                      <button type="button" class="icon-btn-sm danger" (click)="removeFeature(fi)" aria-label="Supprimer">×</button>
                    </div>
                  }
                </div>
              </div>

              <div class="subsection">
                <div class="subsection-head">
                  <h3>Stores</h3>
                  <button type="button" class="btn-add-sm" (click)="addStore()">+ Ajouter</button>
                </div>
                <div formArrayName="stores" class="table-list">
                  @if (appStoresArray.length > 0) {
                    <div class="table-header">
                      <span>Label</span><span>URL</span><span>Icône</span><span></span>
                    </div>
                  }
                  @for (store of appStoresArray.controls; track $index; let si = $index) {
                    <div class="table-row" [formGroupName]="si">
                      <input formControlName="label" class="input-sm" placeholder="App Store..." />
                      <input formControlName="url" class="input-sm" placeholder="https://..." />
                      <input formControlName="icon" class="input-sm input-icon" placeholder="📱" />
                      <button type="button" class="icon-btn-sm danger" (click)="removeStore(si)" aria-label="Supprimer">×</button>
                    </div>
                  }
                </div>
              </div>

              <div class="subsection">
                <div class="subsection-head">
                  <h3>Réseaux sociaux</h3>
                  <button type="button" class="btn-add-sm" (click)="addSocial()">+ Ajouter</button>
                </div>
                <div formArrayName="social" class="table-list">
                  @if (appSocialArray.length > 0) {
                    <div class="table-header table-header-2col">
                      <span>Icône / Identifiant</span><span>URL</span><span></span>
                    </div>
                  }
                  @for (soc of appSocialArray.controls; track $index; let soci = $index) {
                    <div class="table-row table-row-2col" [formGroupName]="soci">
                      <input formControlName="icon" class="input-sm" placeholder="facebook / 📘" />
                      <input formControlName="url" class="input-sm" placeholder="https://..." />
                      <button type="button" class="icon-btn-sm danger" (click)="removeSocial(soci)" aria-label="Supprimer">×</button>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- ─── BADGES ─── -->
          @if (activeTab() === 'badges') {
            <div class="section">
              <div class="section-head">
                <div>
                  <h2>Badges de confiance</h2>
                  <p>Labels de sécurité et modes de paiement affichés dans le footer.</p>
                </div>
              </div>
              <div class="badge-panels">
                <div class="badge-panel" formGroupName="securitySection">
                  <div class="badge-panel-title">🛡️ Sécurité</div>
                  <label class="field">
                    <span class="field-label">Titre de la section</span>
                    <input formControlName="title" placeholder="Ex: Paiement sécurisé" />
                  </label>
                  <div class="subsection-head mt-sm">
                    <span class="field-label">Badges</span>
                    <button type="button" class="btn-add-sm" (click)="addSecurityBadge()">+ Ajouter</button>
                  </div>
                  <div formArrayName="badges" class="pill-list">
                    @for (b of securityBadgesArray.controls; track $index; let bi = $index) {
                      <div class="pill-item">
                        <input [formControlName]="bi" class="input-sm" placeholder="SSL, 3D Secure..." />
                        <button type="button" class="icon-btn-sm danger" (click)="removeSecurityBadge(bi)" aria-label="Supprimer">×</button>
                      </div>
                    }
                  </div>
                </div>

                <div class="badge-panel" formGroupName="paymentSection">
                  <div class="badge-panel-title">💳 Paiements</div>
                  <label class="field">
                    <span class="field-label">Titre de la section</span>
                    <input formControlName="title" placeholder="Ex: Modes de paiement" />
                  </label>
                  <div class="subsection-head mt-sm">
                    <span class="field-label">Badges</span>
                    <button type="button" class="btn-add-sm" (click)="addPaymentBadge()">+ Ajouter</button>
                  </div>
                  <div formArrayName="badges" class="pill-list">
                    @for (b of paymentBadgesArray.controls; track $index; let bi = $index) {
                      <div class="pill-item">
                        <input [formControlName]="bi" class="input-sm" placeholder="Visa, Orange Money..." />
                        <button type="button" class="icon-btn-sm danger" (click)="removePaymentBadge(bi)" aria-label="Supprimer">×</button>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- ─── MENTIONS LÉGALES ─── -->
          @if (activeTab() === 'legal') {
            <div class="section" formGroupName="legal">
              <div class="section-head">
                <div>
                  <h2>Mentions légales</h2>
                  <p>Copyright et liens légaux affichés en bas du footer.</p>
                </div>
              </div>
              <label class="field field-wide">
                <span class="field-label">Copyright</span>
                <input formControlName="copyright" placeholder="© 2024 C'EMPIRE. Tous droits réservés." />
              </label>
              <div class="subsection">
                <div class="subsection-head">
                  <h3>Liens légaux</h3>
                  <button type="button" class="btn-add-sm" (click)="addLegalLink()">+ Ajouter un lien</button>
                </div>
                <div formArrayName="links" class="table-list">
                  @if (legalLinksArray.length > 0) {
                    <div class="table-header table-header-2col">
                      <span>Libellé</span><span>URL</span><span></span>
                    </div>
                  }
                  @for (link of legalLinksArray.controls; track $index; let li = $index) {
                    <div class="table-row table-row-2col" [formGroupName]="li">
                      <input formControlName="label" class="input-sm" placeholder="CGU, Confidentialité..." />
                      <input formControlName="url" class="input-sm" placeholder="https://..." />
                      <button type="button" class="icon-btn-sm danger" (click)="removeLegalLink(li)" aria-label="Supprimer">×</button>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

        </form>
      }
    </div>
  `,
  styles: [`
    /* ── Root ── */
    .crm-page { display: grid; gap: 20px; padding: 24px; background: #f4f6f9; min-height: 100%; }

    /* ── Header ── */
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    .page-title h1 { margin: 0; font-size: clamp(1.4rem, 2.3vw, 1.9rem); font-weight: 700; color: #1a2332; }
    .page-title p { margin: 4px 0 0; color: #6b7280; font-size: .9rem; }
    .page-actions { display: flex; gap: 10px; align-items: center; }

    /* ── Buttons ── */
    .btn { height: 38px; padding: 0 18px; border-radius: 8px; font-size: .875rem; font-weight: 600; cursor: pointer; border: none; transition: all .15s; }
    .btn-primary { background: #d05a2d; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #b94d24; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-outline { background: #fff; color: #374151; border: 1px solid #d1d5db; }
    .btn-outline:hover { background: #f9fafb; }
    .btn-add { height: 36px; padding: 0 14px; border-radius: 8px; background: #fff; border: 1px dashed #d05a2d; color: #d05a2d; font-size: .82rem; font-weight: 700; cursor: pointer; }
    .btn-add:hover { background: #fff5f0; }
    .btn-add-sm { height: 28px; padding: 0 10px; border-radius: 6px; background: transparent; border: 1px dashed #d1d5db; color: #6b7280; font-size: .78rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .btn-add-sm:hover { border-color: #d05a2d; color: #d05a2d; background: #fff5f0; }
    .btn-add-link { height: 28px; padding: 0 10px; border-radius: 6px; background: transparent; border: 1px dashed #ccc; color: #9ca3af; font-size: .78rem; font-weight: 700; cursor: pointer; width: 100%; text-align: left; margin-top: 6px; }
    .btn-add-link:hover { border-color: #d05a2d; color: #d05a2d; background: #fff5f0; }
    .icon-btn { width: 30px; height: 30px; border-radius: 6px; border: none; cursor: pointer; display: grid; place-items: center; font-size: .85rem; transition: all .15s; }
    .icon-btn.danger { background: #fff5f5; color: #dc2626; }
    .icon-btn.danger:hover { background: #fee2e2; }
    .icon-btn-sm { width: 24px; height: 24px; border-radius: 5px; border: none; cursor: pointer; display: grid; place-items: center; font-size: .85rem; line-height: 1; transition: all .15s; flex-shrink: 0; }
    .icon-btn-sm.danger { background: #fff5f5; color: #dc2626; }
    .icon-btn-sm.danger:hover { background: #fee2e2; }

    /* ── Alerts ── */
    .alert { border-radius: 10px; padding: 10px 14px; font-weight: 600; font-size: .875rem; display: flex; align-items: center; gap: 8px; }
    .alert-error { background: #fff3ef; border: 1px solid #f5c5b7; color: #b92016; }
    .alert-success { background: #eefbf7; border: 1px solid #b9eadf; color: #0b6557; }

    /* ── Loading ── */
    .loading-state { display: flex; align-items: center; gap: 12px; padding: 40px; color: #6b7280; font-weight: 600; background: #fff; border-radius: 14px; border: 1px solid #e5e7eb; }
    .spinner-ring { width: 22px; height: 22px; border: 3px solid #e5e7eb; border-top-color: #d05a2d; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Tabs ── */
    .tab-nav { display: flex; gap: 4px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 6px; flex-wrap: wrap; }
    .tab-btn { display: flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px; border-radius: 8px; border: none; background: transparent; color: #6b7280; font-size: .875rem; font-weight: 600; cursor: pointer; transition: all .15s; }
    .tab-btn:hover { background: #f3f4f6; color: #374151; }
    .tab-btn.active { background: #fff5f0; color: #d05a2d; }
    .tab-icon { font-size: 1rem; }

    /* ── Tab Body ── */
    .tab-body { display: grid; gap: 0; }

    /* ── Section ── */
    .section { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 24px; display: grid; gap: 20px; }
    .section-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    .section-head h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1a2332; }
    .section-head p { margin: 4px 0 0; color: #6b7280; font-size: .875rem; }
    .subsection { display: grid; gap: 10px; }
    .subsection-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .subsection-head h3 { margin: 0; font-size: .95rem; font-weight: 700; color: #374151; }
    .mt-sm { margin-top: 8px; }

    /* ── Form fields ── */
    .field { display: grid; gap: 6px; }
    .field-wide { grid-column: 1 / -1; }
    .field-label { font-size: .8rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: .04em; }
    .form-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }

    input, textarea { height: 40px; padding: 0 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: .875rem; color: #1a2332; background: #fff; transition: border-color .15s; width: 100%; box-sizing: border-box; }
    input:focus, textarea:focus { outline: none; border-color: #d05a2d; box-shadow: 0 0 0 3px rgba(208,90,45,.1); }
    textarea { height: auto; padding: 10px 12px; resize: vertical; }

    /* ── Columns grid ── */
    .columns-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
    .col-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; display: grid; gap: 10px; }
    .col-card-header { display: flex; gap: 8px; align-items: center; }
    .input-title { flex: 1; font-weight: 700; font-size: .9rem; }
    .links-list { display: grid; gap: 6px; }
    .link-row { display: flex; gap: 6px; align-items: center; }
    .input-sm { height: 34px; font-size: .82rem; padding: 0 8px; flex: 1; min-width: 0; }
    .input-url { flex: 1.5; }
    .input-icon { max-width: 60px; text-align: center; }

    /* ── Pill list (simple string arrays) ── */
    .pill-list { display: grid; gap: 6px; }
    .pill-item { display: flex; gap: 6px; align-items: center; }

    /* ── Table list (key-value rows) ── */
    .table-list { display: grid; gap: 4px; }
    .table-header { display: grid; grid-template-columns: 1fr 2fr 60px 24px; gap: 6px; padding: 0 4px 4px; }
    .table-header span { font-size: .75rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .04em; }
    .table-header-2col { grid-template-columns: 1fr 2fr 24px; }
    .table-row { display: grid; grid-template-columns: 1fr 2fr 60px 24px; gap: 6px; align-items: center; }
    .table-row-2col { grid-template-columns: 1fr 2fr 24px; }

    /* ── Badge panels ── */
    .badge-panels { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
    .badge-panel { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; display: grid; gap: 12px; }
    .badge-panel-title { font-size: 1rem; font-weight: 700; color: #1a2332; }

    @media (max-width: 768px) {
      .crm-page { padding: 14px; }
      .page-header { flex-direction: column; }
      .tab-nav { gap: 2px; }
      .tab-btn { height: 32px; padding: 0 10px; font-size: .8rem; }
      .columns-grid { grid-template-columns: 1fr; }
      .table-row { grid-template-columns: 1fr 1fr 24px; }
      .table-row input:nth-child(3) { display: none; }
    }
  `],
})
export class FooterSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(FooterConfigService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly activeTab = signal<FooterTab>('columns');

  readonly tabs: { id: FooterTab; label: string; icon: string }[] = [
    { id: 'columns', label: 'Navigation',     icon: '🔗' },
    { id: 'promo',   label: 'Carte promo',    icon: '🎯' },
    { id: 'app',     label: 'App & Réseaux',  icon: '📱' },
    { id: 'badges',  label: 'Badges',         icon: '🛡️' },
    { id: 'legal',   label: 'Légal',          icon: '⚖️' },
  ];

  readonly form = this.fb.group({
    columns: this.fb.array([]),
    promoCard: this.fb.group({ title: [''], buttonLabel: [''], buttonUrl: [''], imageUrl: [''] }),
    appSection: this.fb.group({
      title: [''],
      features: this.fb.array([]),
      socialTitle: [''],
      social: this.fb.array([]),
      stores: this.fb.array([]),
    }),
    securitySection: this.fb.group({ title: [''], badges: this.fb.array([]) }),
    paymentSection:  this.fb.group({ title: [''], badges: this.fb.array([]) }),
    legal: this.fb.group({ copyright: [''], links: this.fb.array([]) }),
  });

  get columnsArray(): FormArray        { return this.form.get('columns') as FormArray; }
  get appFeaturesArray(): FormArray    { return (this.form.get('appSection') as FormGroup).get('features') as FormArray; }
  get appSocialArray(): FormArray      { return (this.form.get('appSection') as FormGroup).get('social') as FormArray; }
  get appStoresArray(): FormArray      { return (this.form.get('appSection') as FormGroup).get('stores') as FormArray; }
  get securityBadgesArray(): FormArray { return (this.form.get('securitySection') as FormGroup).get('badges') as FormArray; }
  get paymentBadgesArray(): FormArray  { return (this.form.get('paymentSection') as FormGroup).get('badges') as FormArray; }
  get legalLinksArray(): FormArray     { return (this.form.get('legal') as FormGroup).get('links') as FormArray; }

  getLinksArray(colIndex: number): FormArray {
    return (this.columnsArray.at(colIndex) as FormGroup).get('links') as FormArray;
  }

  ngOnInit(): void { this.reloadConfig(); }

  reloadConfig(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getAdminConfig().subscribe({
      next: (config) => { this.patchFormFromConfig(config); this.loading.set(false); },
      error: () => { this.error.set('Impossible de charger la configuration du footer.'); this.loading.set(false); },
    });
  }

  addColumn(): void {
    this.columnsArray.push(this.fb.group({ title: ['Nouvelle colonne'], links: this.fb.array([]) }));
  }
  removeColumn(i: number): void { this.columnsArray.removeAt(i); }

  addLink(ci: number): void {
    this.getLinksArray(ci).push(this.fb.group({ label: [''], url: [''] }));
  }
  removeLink(ci: number, li: number): void { this.getLinksArray(ci).removeAt(li); }

  addFeature(): void    { this.appFeaturesArray.push(this.fb.control('')); }
  removeFeature(i: number): void { this.appFeaturesArray.removeAt(i); }

  addSocial(): void     { this.appSocialArray.push(this.fb.group({ icon: [''], url: [''] })); }
  removeSocial(i: number): void  { this.appSocialArray.removeAt(i); }

  addStore(): void      { this.appStoresArray.push(this.fb.group({ label: [''], url: [''], icon: [''] })); }
  removeStore(i: number): void   { this.appStoresArray.removeAt(i); }

  addSecurityBadge(): void  { this.securityBadgesArray.push(this.fb.control('')); }
  removeSecurityBadge(i: number): void { this.securityBadgesArray.removeAt(i); }

  addPaymentBadge(): void   { this.paymentBadgesArray.push(this.fb.control('')); }
  removePaymentBadge(i: number): void  { this.paymentBadgesArray.removeAt(i); }

  addLegalLink(): void  { this.legalLinksArray.push(this.fb.group({ label: [''], url: [''] })); }
  removeLegalLink(i: number): void     { this.legalLinksArray.removeAt(i); }

  save(): void {
    this.error.set(null);
    this.success.set(null);
    this.saving.set(true);
    this.svc.updateConfig(this.buildConfig()).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.success.set('Configuration footer mise à jour.');
        this.patchFormFromConfig(saved);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Échec de la sauvegarde.');
      },
    });
  }

  private buildConfig(): FooterConfig {
    const v = this.form.getRawValue() as any;
    return {
      columns: (v.columns || []).map((c: any) => ({
        title: c.title || '',
        links: (c.links || []).map((l: any) => ({ label: l.label || '', url: l.url || '' })),
      })),
      promoCard: {
        title: v.promoCard.title || '',
        buttonLabel: v.promoCard.buttonLabel || '',
        buttonUrl: v.promoCard.buttonUrl || '',
        imageUrl: v.promoCard.imageUrl || '',
      },
      appSection: {
        title: v.appSection.title || '',
        features: (v.appSection.features || []).filter((f: string) => f?.trim()),
        socialTitle: v.appSection.socialTitle || '',
        social: (v.appSection.social || []).map((s: any) => ({ icon: s.icon || '', url: s.url || '' })),
        stores: (v.appSection.stores || []).map((s: any) => ({ label: s.label || '', url: s.url || '', icon: s.icon || '' })),
      },
      securitySection: {
        title: v.securitySection.title || '',
        badges: (v.securitySection.badges || []).filter((b: string) => b?.trim()),
      },
      paymentSection: {
        title: v.paymentSection.title || '',
        badges: (v.paymentSection.badges || []).filter((b: string) => b?.trim()),
      },
      legal: {
        copyright: v.legal.copyright || '',
        links: (v.legal.links || []).map((l: any) => ({ label: l.label || '', url: l.url || '' })),
      },
    };
  }

  private patchFormFromConfig(config: FooterConfig): void {
    this.columnsArray.clear();
    this.appFeaturesArray.clear();
    this.appSocialArray.clear();
    this.appStoresArray.clear();
    this.securityBadgesArray.clear();
    this.paymentBadgesArray.clear();
    this.legalLinksArray.clear();

    (config.columns || []).forEach((col) => {
      const links = this.fb.array(
        (col.links || []).map((l) => this.fb.group({ label: [l.label], url: [l.url] })),
      );
      this.columnsArray.push(this.fb.group({ title: [col.title], links }));
    });

    this.form.patchValue({ promoCard: config.promoCard });

    (this.form.get('appSection') as FormGroup).patchValue({
      title: config.appSection?.title || '',
      socialTitle: config.appSection?.socialTitle || '',
    });
    (config.appSection?.features || []).forEach((f) => this.appFeaturesArray.push(this.fb.control(f)));
    (config.appSection?.social || []).forEach((s) => this.appSocialArray.push(this.fb.group({ icon: [s.icon], url: [s.url] })));
    (config.appSection?.stores || []).forEach((s) => this.appStoresArray.push(this.fb.group({ label: [s.label], url: [s.url], icon: [s.icon] })));

    (this.form.get('securitySection') as FormGroup).patchValue({ title: config.securitySection?.title || '' });
    (config.securitySection?.badges || []).forEach((b) => this.securityBadgesArray.push(this.fb.control(b)));

    (this.form.get('paymentSection') as FormGroup).patchValue({ title: config.paymentSection?.title || '' });
    (config.paymentSection?.badges || []).forEach((b) => this.paymentBadgesArray.push(this.fb.control(b)));

    (this.form.get('legal') as FormGroup).patchValue({ copyright: config.legal?.copyright || '' });
    (config.legal?.links || []).forEach((l) => this.legalLinksArray.push(this.fb.group({ label: [l.label], url: [l.url] })));
  }
}
