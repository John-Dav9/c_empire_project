import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSetting } from './entities/platform-setting.entity';
import {
  DEFAULT_FOOTER_CONFIG,
  FOOTER_SETTINGS_KEY,
} from './footer-default.config';
import {
  CONTENT_PAGES_SETTINGS_KEY,
  DEFAULT_CONTENT_PAGES,
} from './content-pages-default.config';

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectRepository(PlatformSetting)
    private readonly settingRepo: Repository<PlatformSetting>,
  ) {}

  async getFooterConfig() {
    const setting = await this.settingRepo.findOne({
      where: { key: FOOTER_SETTINGS_KEY },
    });
    if (!setting?.value) {
      return DEFAULT_FOOTER_CONFIG;
    }
    return setting.value;
  }

  async updateFooterConfig(config: Record<string, any>) {
    let setting = await this.settingRepo.findOne({
      where: { key: FOOTER_SETTINGS_KEY },
    });

    if (!setting) {
      setting = this.settingRepo.create({
        key: FOOTER_SETTINGS_KEY,
        value: config,
      });
    } else {
      setting.value = config;
    }

    const saved = await this.settingRepo.save(setting);
    return saved.value;
  }

  async getPublicContentPages() {
    const pages = await this.getContentPages();
    return Object.values(pages).filter(
      (page: any) => page?.published !== false,
    );
  }

  async getPublicContentPage(slug: string) {
    const pages = await this.getContentPages();
    const key = this.normalizeSlug(slug);
    const page = pages[key];
    if (!page || page.published === false) {
      return null;
    }
    return page;
  }

  async getAdminContentPages() {
    return this.getContentPages();
  }

  async createContentPage(slug: string, content: Record<string, any>) {
    const { setting, pages } = await this.getOrCreateContentPagesSetting();
    const key = this.normalizeSlug(slug);
    pages[key] = {
      slug: key,
      ...content,
    };
    setting.value = pages;
    await this.settingRepo.save(setting);
    return pages[key];
  }

  async updateContentPage(slug: string, content: Record<string, any>) {
    const { setting, pages } = await this.getOrCreateContentPagesSetting();
    const key = this.normalizeSlug(slug);
    const current = pages[key] ?? { slug: key };
    pages[key] = {
      ...current,
      ...content,
      slug: key,
    };
    setting.value = pages;
    await this.settingRepo.save(setting);
    return pages[key];
  }

  async deleteContentPage(slug: string) {
    const { setting, pages } = await this.getOrCreateContentPagesSetting();
    const key = this.normalizeSlug(slug);
    delete pages[key];
    setting.value = pages;
    await this.settingRepo.save(setting);
    return { success: true };
  }

  private async getContentPages(): Promise<Record<string, any>> {
    const setting = await this.settingRepo.findOne({
      where: { key: CONTENT_PAGES_SETTINGS_KEY },
    });
    if (!setting?.value) {
      return DEFAULT_CONTENT_PAGES;
    }
    return setting.value;
  }

  private async getOrCreateContentPagesSetting(): Promise<{
    setting: PlatformSetting;
    pages: Record<string, any>;
  }> {
    let setting = await this.settingRepo.findOne({
      where: { key: CONTENT_PAGES_SETTINGS_KEY },
    });
    if (!setting) {
      setting = this.settingRepo.create({
        key: CONTENT_PAGES_SETTINGS_KEY,
        value: { ...DEFAULT_CONTENT_PAGES },
      });
      setting = await this.settingRepo.save(setting);
    }
    return {
      setting,
      pages: { ...(setting.value ?? {}) },
    };
  }

  private normalizeSlug(raw: string): string {
    return String(raw ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '');
  }
}
