export const FOOTER_SETTINGS_KEY = 'footer_config_v1';

export const DEFAULT_FOOTER_CONFIG = {
  columns: [
    {
      title: 'Nous connaitre',
      links: [
        { label: "A propos de C'EMPIRE", url: '/a-propos' },
        { label: 'Nos missions', url: '/nos-missions' },
        { label: 'Contactez-nous', url: '#' },
        { label: "Mentions legales et informations d'entreprise", url: '#' },
        { label: "C'EMPIRE CAREER", url: '/careers' },
      ],
    },
    {
      title: 'Service client',
      links: [
        { label: 'Politique de retour et remboursement', url: '#' },
        { label: 'Politique de propriete intellectuelle', url: '#' },
        { label: 'Informations de livraison', url: '#' },
        {
          label: 'Politique de confidentialite',
          url: '/politique-confidentialite',
        },
        { label: 'Politique des cookies', url: '/politique-cookies' },
        { label: 'Alertes de securite des produits', url: '#' },
      ],
    },
    {
      title: 'Aide',
      links: [
        { label: "Centre d'aide et FAQ", url: '/faq' },
        { label: 'Devenir partenaire', url: '/devenir-partenaire' },
        {
          label: 'Nos partenaires de confiance',
          url: '/partenaires-confiance',
        },
        { label: 'Centre de securite', url: '#' },
        { label: 'Protection des achats', url: '#' },
        { label: 'Accessibilite', url: '#' },
      ],
    },
  ],
  promoCard: {
    title: "Commencez a vendre a des millions d'acheteurs",
    buttonLabel: "Vendre sur C'EMPIRE",
    buttonUrl: '#',
    imageUrl: '/media/logos/cshop-log.jpg',
  },
  appSection: {
    title: "Telechargez l'app C'EMPIRE",
    features: [
      'Alertes de baisse de prix',
      'Suivi des commandes',
      'Paiement plus rapide',
      'Offres exclusives',
    ],
    stores: [
      { label: 'App Store', url: '#', icon: 'apple' },
      { label: 'Google Play', url: '#', icon: 'shop' },
    ],
    socialTitle: "Connectez-vous avec C'EMPIRE",
    social: [
      { icon: 'photo_camera', url: '#' },
      { icon: 'facebook', url: '#' },
      { icon: 'close', url: '#' },
      { icon: 'music_note', url: '#' },
      { icon: 'smart_display', url: '#' },
      { icon: 'interests', url: '#' },
    ],
  },
  securitySection: {
    title: 'Certificats de securite',
    badges: [
      'PCI DSS',
      'Paiement securise',
      'Visa Secure',
      'ID Check',
      'SafeKey',
      'ProtectBuy',
    ],
  },
  paymentSection: {
    title: 'Nous acceptons',
    badges: [
      'Bancontact',
      'Klarna',
      'Visa',
      'Mastercard',
      'Amex',
      'PayPal',
      'Apple Pay',
      'Google Pay',
    ],
  },
  legal: {
    copyright: "© 2022 - 2026 C'EMPIRE Inc.",
    links: [
      { label: "Conditions d'utilisation", url: '#' },
      {
        label: 'Politique de confidentialite',
        url: '/politique-confidentialite',
      },
      { label: 'Vos choix en matiere de confidentialite', url: '#' },
      { label: 'Choix de pub', url: '#' },
    ],
  },
};
