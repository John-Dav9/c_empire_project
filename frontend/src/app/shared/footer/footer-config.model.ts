export interface FooterLink {
  label: string;
  url: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterPromoCard {
  title: string;
  buttonLabel: string;
  buttonUrl: string;
  imageUrl: string;
}

export interface FooterStoreLink {
  label: string;
  url: string;
  icon: string;
}

export interface FooterSocialLink {
  icon: string;
  url: string;
}

export interface FooterAppSection {
  title: string;
  features: string[];
  stores: FooterStoreLink[];
  socialTitle: string;
  social: FooterSocialLink[];
}

export interface FooterBadgeSection {
  title: string;
  badges: string[];
}

export interface FooterLegal {
  copyright: string;
  links: FooterLink[];
}

export interface FooterConfig {
  columns: FooterColumn[];
  promoCard: FooterPromoCard;
  appSection: FooterAppSection;
  securitySection: FooterBadgeSection;
  paymentSection: FooterBadgeSection;
  legal: FooterLegal;
}
