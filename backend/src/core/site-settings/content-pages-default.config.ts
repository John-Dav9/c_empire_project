export const CONTENT_PAGES_SETTINGS_KEY = 'content_pages_v1';

export const DEFAULT_CONTENT_PAGES = {
  home: {
    slug: 'home',
    title: "Accueil C'EMPIRE",
    subtitle: 'Configuration editoriale de la page d accueil.',
    heroTitle: "Tout C'EMPIRE, dans une seule experience fluide.",
    heroText:
      'Boutique, livraison, grill, nettoyage, evenements et taches: un design unique, une navigation claire, un parcours utilisateur continu.',
    ctaLabel: 'Demarrer par la boutique',
    ctaUrl: '/shop',
    published: true,
    sections: [],
    highlights: [
      'Plateforme multi-services',
      'Pilotage admin',
      'Parcours unifies',
    ],
    metadata: {
      eyebrow: 'Plateforme Multi-services',
      secondaryCtaLabel: "Tester C'Express",
      secondaryCtaUrl: '/express',
      stats: [
        { value: '+10k', label: 'Produits actifs' },
        { value: '50k', label: 'Clients servis' },
        { value: '6', label: 'Services connectes' },
      ],
      finalCtaTitle: 'Pret a passer en mode production ?',
      finalCtaText:
        "Lancez un parcours d'achat complet et testez vos nouveaux flux.",
      finalCtaLabel: 'Aller au panier',
      finalCtaUrl: '/shop/cart',
    },
  },
  'a-propos': {
    slug: 'a-propos',
    title: "A propos de C'EMPIRE",
    subtitle:
      'Une plateforme unifiee pour simplifier vos achats et services du quotidien.',
    heroTitle: "Construire l'experience commerce et services la plus fiable.",
    heroText:
      "C'EMPIRE rassemble C'Shop, C'Grill, C'Express, C'Clean, C'Events et C'Todo dans un seul parcours client, avec une execution operationnelle rigoureuse.",
    ctaLabel: 'Decouvrir nos secteurs',
    ctaUrl: '/',
    published: true,
    sections: [
      {
        title: 'Notre histoire',
        body: "Nees d'un besoin de centraliser les operations, nos equipes ont construit une architecture multi-secteurs qui conserve une experience utilisateur simple et coherente.",
      },
      {
        title: 'Notre approche',
        body: 'Nous combinons produit, operations et data pour suivre chaque commande de bout en bout et offrir un service mesurable.',
      },
    ],
    highlights: [
      'Plateforme multi-secteurs',
      'Suivi temps reel',
      'Support client structure',
    ],
  },
  'nos-missions': {
    slug: 'nos-missions',
    title: 'Nos missions',
    subtitle:
      'Des objectifs clairs pour la qualite, la vitesse et la confiance.',
    heroTitle: 'Nos engagements au quotidien',
    heroText:
      "Chaque secteur C'EMPIRE s'appuie sur des standards communs: qualite de service, transparence des operations et protection des utilisateurs.",
    ctaLabel: 'Nous contacter',
    ctaUrl: '/profile',
    published: true,
    sections: [
      {
        title: 'Mission client',
        body: "Rendre l'achat et la reservation plus rapides, plus lisibles et plus fiables.",
      },
      {
        title: 'Mission operationnelle',
        body: 'Outiller les equipes terrain avec des flux clairs et des indicateurs exploitables.',
      },
      {
        title: 'Mission gouvernance',
        body: 'Assurer une administration robuste des roles, permissions, audits et parametres plateforme.',
      },
    ],
    highlights: [
      'Qualite mesurable',
      'Execution rapide',
      'Securite et conformite',
    ],
  },
  faq: {
    slug: 'faq',
    title: 'FAQ',
    subtitle: 'Questions frequentes sur les commandes, paiements et services.',
    heroTitle: 'Besoin de reponses rapides ?',
    heroText:
      'Retrouvez ici les reponses les plus demandees par nos clients et partenaires.',
    ctaLabel: 'Contacter le support',
    ctaUrl: '/profile',
    published: true,
    sections: [],
    faq: [
      {
        question: 'Comment suivre ma commande ?',
        answer:
          "Depuis votre espace client, section commandes. Vous y trouverez le statut et l'historique complet.",
      },
      {
        question: 'Quels moyens de paiement sont acceptes ?',
        answer:
          'La plateforme supporte les paiements cartes et wallets compatibles selon la configuration active.',
      },
      {
        question: 'Puis-je annuler une reservation de service ?',
        answer:
          'Oui, selon les conditions du secteur concerne. Les details apparaissent lors de la confirmation.',
      },
    ],
    highlights: [
      'Support structure',
      'Reponses par secteur',
      'Mise a jour continue',
    ],
  },
  'politique-confidentialite': {
    slug: 'politique-confidentialite',
    title: 'Politique de confidentialite',
    subtitle: 'Comment nous collectons, utilisons et protégeons vos données.',
    heroTitle: 'Protection de vos donnees personnelles',
    heroText:
      "C'EMPIRE applique une politique de minimisation des donnees, de securisation et de tracabilite des acces.",
    ctaLabel: 'Voir la politique cookies',
    ctaUrl: '/politique-cookies',
    published: true,
    sections: [
      {
        title: 'Donnees collectees',
        body: 'Informations de compte, transactions, historique de commandes et donnees techniques necessaires au service.',
      },
      {
        title: 'Utilisation',
        body: "Traitement des commandes, prevention de fraude, amelioration de l'experience et obligations legales.",
      },
      {
        title: 'Droits utilisateurs',
        body: 'Vous pouvez demander acces, rectification, suppression et limitation selon la legislation applicable.',
      },
    ],
    highlights: ['Transparence', 'Securite', 'Controle utilisateur'],
  },
  'politique-cookies': {
    slug: 'politique-cookies',
    title: 'Politique des cookies',
    subtitle: 'Informations sur les cookies utilises par la plateforme.',
    heroTitle: 'Gestion des cookies et traceurs',
    heroText:
      'Nous utilisons des cookies strictement necessaires, analytiques et de personnalisation selon vos choix.',
    ctaLabel: 'Gerer mes preferences',
    ctaUrl: '/profile',
    published: true,
    sections: [
      {
        title: 'Cookies essentiels',
        body: "Necessaires au fonctionnement de l'authentification, du panier et des parcours de paiement.",
      },
      {
        title: 'Cookies analytiques',
        body: "Utilises pour mesurer les performances et ameliorer l'ergonomie.",
      },
      {
        title: 'Consentement',
        body: 'Vous pouvez modifier vos choix a tout moment depuis votre espace compte.',
      },
    ],
    highlights: [
      'Controle des preferences',
      'Mesure de performance',
      'Conformite RGPD',
    ],
  },
  'devenir-partenaire': {
    slug: 'devenir-partenaire',
    title: 'Devenir partenaire',
    subtitle: "Rejoignez l'ecosysteme C'EMPIRE et developpez votre activite.",
    heroTitle: 'Partenariat commercial et operationnel',
    heroText:
      'Commercants, prestataires de services, logisticiens et agences peuvent integrer la plateforme avec un parcours accompagne.',
    ctaLabel: 'Soumettre ma candidature',
    ctaUrl: '/auth/signup',
    published: true,
    sections: [
      {
        title: 'Types de partenariats',
        body: 'Vente marketplace, prestations, logistique et programmes co-marketing.',
      },
      {
        title: "Processus d'integration",
        body: 'Qualification, onboarding, tests operationnels, mise en production.',
      },
    ],
    highlights: [
      'Onboarding rapide',
      'Visibilite multi-secteurs',
      'Pilotage de performance',
    ],
  },
  'partenaires-confiance': {
    slug: 'partenaires-confiance',
    title: 'Nos partenaires de confiance',
    subtitle: 'Des collaborations solides pour assurer la qualite de service.',
    heroTitle: 'Un reseau de partenaires verifies',
    heroText:
      'Nos partenaires sont selectionnes sur des criteres de fiabilite operationnelle, qualite et conformite.',
    ctaLabel: 'Devenir partenaire',
    ctaUrl: '/devenir-partenaire',
    published: true,
    sections: [
      {
        title: 'Commerce et distribution',
        body: 'Reseau de fournisseurs et de distributeurs pour garantir la disponibilite produits.',
      },
      {
        title: 'Services et operations',
        body: "Equipes de terrain specialisees pour l'execution des prestations.",
      },
    ],
    highlights: [
      'Selection qualitative',
      'Engagement contractuel',
      'Amelioration continue',
    ],
  },
  careers: {
    slug: 'careers',
    title: "Jobs - C'EMPIRE CAREER",
    subtitle:
      'Construisons ensemble la prochaine generation de services digitaux.',
    heroTitle: 'Rejoignez nos equipes',
    heroText:
      'Nous recrutons des profils produit, operations, support et engineering pour accelerer la plateforme.',
    ctaLabel: 'Postuler maintenant',
    ctaUrl: '/auth/signup',
    published: true,
    sections: [
      {
        title: 'Culture',
        body: 'Rigueur, responsabilite, execution et sens du service client.',
      },
      {
        title: 'Postes ouverts',
        body: 'Supervision operations, service client, developpement frontend/backend, coordination terrain.',
      },
    ],
    highlights: ['Impact direct', 'Equipes transverses', 'Evolution rapide'],
  },
};
