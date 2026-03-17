import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { FooterConfig } from '../../shared/footer/footer-config.model';

@Injectable({ providedIn: 'root' })
export class FooterConfigService {
  constructor(private readonly api: ApiService) {}

  getPublicConfig(): Observable<FooterConfig> {
    return this.api.get<FooterConfig>('/settings/footer/public');
  }

  getAdminConfig(): Observable<FooterConfig> {
    return this.api.get<FooterConfig>('/settings/footer');
  }

  updateConfig(config: FooterConfig): Observable<FooterConfig> {
    return this.api.patch<FooterConfig>('/settings/footer', { config });
  }
}
