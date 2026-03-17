import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { FooterConfigService } from '../../core/services/footer-config.service';
import { FooterConfig } from './footer-config.model';
import { DEFAULT_FOOTER_CONFIG } from './footer-default.config';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './site-footer.component.html',
  styleUrls: ['./site-footer.component.scss'],
})
export class SiteFooterComponent implements OnInit {
  config: FooterConfig = DEFAULT_FOOTER_CONFIG;

  constructor(private readonly footerConfigService: FooterConfigService) {}

  ngOnInit(): void {
    this.footerConfigService.getPublicConfig().subscribe({
      next: (data) => {
        if (data) this.config = data;
      },
      error: () => {
        this.config = DEFAULT_FOOTER_CONFIG;
      },
    });
  }

  isExternal(url: string): boolean {
    return /^https?:\/\//i.test(url || '');
  }
}
