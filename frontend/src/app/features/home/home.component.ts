import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { buildApiUrl, buildMediaUrl } from '../../core/config/api.config';
import { ContentPage, ContentPagesService } from '../../core/services/content-pages.service';

interface HeroSlide {
  src: string;
  alt: string;
}

interface SectorSlide {
  src: string;
  title: string;
  subtitle: string;
}

interface SectorStory {
  name: string;
  description: string;
  route: string;
  ctaLabel: string;
  logoSrc?: string;
  logoAlt?: string;
  slides: SectorSlide[];
}

interface FeaturedCampaignItem {
  sector: string;
  title: string;
  route: string;
  description?: string;
  imageUrl?: string;
}

interface FeaturedCampaign {
  id: string;
  title: string;
  festivalName: string;
  tabLabel?: string;
  items?: FeaturedCampaignItem[];
}

interface NewsMessage {
  id: string;
  title: string;
  message: string;
}

interface HomeStat {
  value: string;
  label: string;
}

interface HomeContent {
  eyebrow: string;
  heroTitle: string;
  heroText: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
  stats: HomeStat[];
  finalCtaTitle: string;
  finalCtaText: string;
  finalCtaLabel: string;
  finalCtaUrl: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly contentPagesService = inject(ContentPagesService);
  private readonly defaultSectorLogo = '/media/logos/cempire-log.jpg';
  private readonly allowedRoutePrefixes = [
    '/',
    '/shop',
    '/grill',
    '/express',
    '/clean',
    '/events',
    '/todo',
    '/profile',
    '/client',
    '/admin',
    '/employee',
    '/super-admin',
    '/payments',
    '/auth',
  ];

  readonly brandLogoSrc = signal('/media/logos/cempire-log.jpg');
  readonly homeContent = signal<HomeContent>({
    eyebrow: 'Plateforme Multi-services',
    heroTitle: "Tout C'EMPIRE, dans une seule expérience fluide.",
    heroText:
      "Boutique, livraison, grill, nettoyage, événements et tâches: un design unique, une navigation claire, un parcours utilisateur continu.",
    primaryCtaLabel: 'Démarrer par la boutique',
    primaryCtaUrl: '/shop',
    secondaryCtaLabel: "Tester C'Express",
    secondaryCtaUrl: '/express',
    stats: [
      { value: '+10k', label: 'Produits actifs' },
      { value: '50k', label: 'Clients servis' },
      { value: '6', label: 'Services connectés' },
    ],
    finalCtaTitle: 'Prêt à passer en mode production?',
    finalCtaText: "Lancez un parcours d'achat complet et testez vos nouveaux flux.",
    finalCtaLabel: 'Aller au panier',
    finalCtaUrl: '/shop/cart',
  });

  readonly heroSlides: HeroSlide[] = [
    { src: '/media/hero-1.jpg', alt: 'Service traiteur et buffet en entreprise' },
    { src: '/media/hero-2.jpg', alt: 'Collaboration d equipe dans un espace de travail' },
    { src: '/media/hero-3.jpg', alt: 'Equipe celebrant un resultat sur ordinateur' },
  ];

  readonly currentSlide = signal(0);
  readonly sectorStories = signal<SectorStory[]>([
    {
      name: "C'Shop",
      description: 'Du repérage au panier, vos achats deviennent simples, rapides et continus.',
      route: '/shop',
      ctaLabel: 'Découvrir la boutique',
      logoSrc: '/media/logos/cshop-logo.png',
      logoAlt: "Logo C'Shop",
      slides: [
        { src: '/media/cshop-1.jpg', title: 'Vitrine premium', subtitle: 'Une entrée visuelle claire qui attire et rassure.' },
        { src: '/media/cshop-2.jpg', title: 'Rayons complets', subtitle: 'Une offre large pour couvrir tous les besoins.' },
        { src: '/media/cshop-3.jpg', title: 'Achat plaisir', subtitle: 'Mode et lifestyle intégrés au parcours client.' },
        { src: '/media/cshop-4.jpg', title: 'Collection en magasin', subtitle: 'Des espaces modernes pour valoriser les produits.' },
        { src: '/media/cshop-5.jpg', title: 'Sélection experte', subtitle: 'Des articles premium mis en avant intelligemment.' },
        { src: '/media/cshop-6.jpg', title: 'Offres visibles', subtitle: 'Promotions et signalétiques pour accélérer la décision.' },
        { src: '/media/cshop-7.jpg', title: "Invitation à l'achat", subtitle: 'Un message simple: entrer, explorer, commander.' },
      ],
    },
    {
      name: "C'Grill & Food",
      description: 'Une expérience food claire: menu, choix, confirmation et préparation.',
      route: '/grill',
      ctaLabel: 'Commander au grill',
      logoSrc: '/media/logos/cgrill-logo.png',
      logoAlt: "Logo C'Grill & Food",
      slides: [
        { src: '/media/cgrill-1.jpg', title: 'Assiette signature', subtitle: 'Des plats premium présentés avec précision.' },
        { src: '/media/cgrill-2.jpg', title: 'Sélection du chef', subtitle: "Textures, épices et dressage au centre de l'expérience." },
        { src: '/media/cgrill-3.jpg', title: 'Pièces grillées', subtitle: 'Cuisson maîtrisée et saveurs intenses.' },
        { src: '/media/cgrill-4.jpg', title: 'Option healthy', subtitle: 'Bols frais et équilibrés pour tous les profils.' },
        { src: '/media/cgrill-5.jpg', title: 'Feu vif', subtitle: "Le grill monte en température, la cuisine s'active." },
        { src: '/media/cgrill-6.jpg', title: 'Service live', subtitle: 'Brochettes et grillades prêtes à être servies.' },
        { src: '/media/cgrill-7.jpg', title: 'Saveur fumée', subtitle: 'La signature barbecue qui marque la différence.' },
        { src: '/media/cgrill-8.jpg', title: 'Maîtrise du geste', subtitle: 'Chaque cuisson suit un standard de qualité constant.' },
      ],
    },
    {
      name: "C'Express",
      description: 'Une logistique connectée pour envoyer et recevoir sans perte de temps.',
      route: '/express',
      ctaLabel: 'Lancer une livraison',
      logoSrc: '/media/logos/cexpress-logo.png',
      logoAlt: "Logo C'Express",
      slides: [
        { src: '/media/cexpress-1.jpg', title: 'Course lancée', subtitle: 'Les livreurs prennent la route immédiatement.' },
        { src: '/media/cexpress-2.jpg', title: 'Chargement en cours', subtitle: 'Les colis sont triés et préparés pour départ.' },
        { src: '/media/cexpress-3.jpg', title: 'Capacité optimisée', subtitle: 'Chaque véhicule maximise les tournées.' },
        { src: '/media/cexpress-4.jpg', title: 'Acheminement rapide', subtitle: 'Livraison active avec suivi de bout en bout.' },
        { src: '/media/cexpress-5.jpg', title: 'Dernier kilomètre', subtitle: 'Le colis arrive vite chez le destinataire.' },
      ],
    },
    {
      name: "C'Clean",
      description: 'Planifiez, assignez et suivez les interventions de nettoyage avec précision.',
      route: '/clean',
      ctaLabel: 'Réserver un service',
      logoSrc: '/media/logos/cclean-logo.png',
      logoAlt: "Logo C'Clean",
      slides: [
        { src: '/media/cclean-1.jpg', title: 'Surfaces sensibles', subtitle: 'Nettoyage précis avec protection adaptée.' },
        { src: '/media/cclean-2.jpg', title: 'Produits maîtrisés', subtitle: 'Solutions ciblées selon chaque zone.' },
        { src: '/media/cclean-3.jpg', title: 'Intervention hôtelière', subtitle: 'Équipes équipées pour les grands volumes.' },
        { src: '/media/cclean-4.jpg', title: 'Textiles et assises', subtitle: 'Aspiration profonde et finition propre.' },
        { src: '/media/cclean-5.jpg', title: 'Sols impeccables', subtitle: 'Traitement minutieux des surfaces étendues.' },
        { src: '/media/cclean-6.jpg', title: 'Désinfection active', subtitle: 'Pulvérisation contrôlée et essuyage sûr.' },
        { src: '/media/cclean-7.jpg', title: 'Bureaux et postes', subtitle: 'Hygiène quotidienne en environnement pro.' },
        { src: '/media/cclean-8.jpg', title: 'Entretien intensif', subtitle: 'Nettoyage renforcé pour zones critiques.' },
        { src: '/media/cclean-9.jpg', title: 'Remise en état', subtitle: 'Résultat net, contrôlé et vérifiable.' },
      ],
    },
    {
      name: "C'Events",
      description: 'Créez des événements mémorables avec un parcours de réservation sans effort.',
      route: '/events',
      ctaLabel: 'Voir les événements',
      slides: [
        { src: '/media/hero-1.jpg', title: 'Programme en ligne', subtitle: 'Agenda lisible et inscription immédiate.' },
        { src: '/media/hero-3.jpg', title: 'Participants engagés', subtitle: 'Suivi des présences et interactions.' },
        { src: '/media/hero-2.jpg', title: "Retour d'expérience", subtitle: "Mesurez l'impact après chaque événement." },
      ],
    },
    {
      name: "C'Todo",
      description: 'Vos tâches, vos équipes et vos priorités alignées dans un seul flux.',
      route: '/todo',
      ctaLabel: 'Gérer mes tâches',
      logoSrc: '/media/logos/ctodo-logo.png',
      logoAlt: "Logo C'Todo",
      slides: [
        { src: '/media/hero-2.jpg', title: 'Plan du jour', subtitle: "Priorités visibles pour toute l'équipe." },
        { src: '/media/hero-3.jpg', title: 'Exécution suivie', subtitle: 'Statuts et blocages remontent immédiatement.' },
        { src: '/media/hero-1.jpg', title: 'Objectif atteint', subtitle: 'Clôture rapide et reporting propre.' },
      ],
    },
  ]);

  readonly sectorSlideIndex = signal<number[]>([]);
  readonly featuredCampaigns = signal<FeaturedCampaign[]>([]);
  readonly newsMessages = signal<NewsMessage[]>([]);
  readonly featuredLoading = signal(false);
  readonly highlightsError = signal<string | null>(null);

  private sectorAutoplayPaused = false;
  private autoplayId: ReturnType<typeof setInterval> | null = null;
  private sectorAutoplayId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.startAutoplay();
    this.sectorSlideIndex.set(this.sectorStories().map(() => 0));
    this.startSectorAutoplay();
    this.loadHomeContent();
    this.loadHighlights();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
    this.stopSectorAutoplay();
  }

  nextSlide(): void {
    if (this.heroSlides.length < 2) return;
    this.currentSlide.update((s) => (s + 1) % this.heroSlides.length);
  }

  sectorTransform(sectorIndex: number): string {
    const index = this.sectorSlideIndex()[sectorIndex] ?? 0;
    return `translateX(-${index * 100}%)`;
  }

  getSectorClasses(route: string, index: number): string {
    const themeMap: Record<string, string> = {
      '/shop': 'theme-shop',
      '/grill': 'theme-grill',
      '/express': 'theme-express',
      '/clean': 'theme-clean',
      '/events': 'theme-events',
      '/todo': 'theme-todo',
    };
    const theme = themeMap[route] ?? 'theme-default';
    const reversed = index % 2 === 1 ? ' is-reversed' : '';
    return `sector-story app-shell-card ${theme}${reversed}`;
  }

  nextSectorSlide(sectorIndex: number): void {
    const story = this.sectorStories()[sectorIndex];
    if (!story || story.slides.length < 2) return;
    this.sectorSlideIndex.update((arr) => {
      const next = [...arr];
      next[sectorIndex] = ((arr[sectorIndex] ?? 0) + 1) % story.slides.length;
      return next;
    });
  }

  prevSectorSlide(sectorIndex: number): void {
    const story = this.sectorStories()[sectorIndex];
    if (!story || story.slides.length < 2) return;
    this.sectorSlideIndex.update((arr) => {
      const next = [...arr];
      next[sectorIndex] =
        ((arr[sectorIndex] ?? 0) - 1 + story.slides.length) % story.slides.length;
      return next;
    });
  }

  setSectorSlide(sectorIndex: number, slideIndex: number): void {
    const story = this.sectorStories()[sectorIndex];
    if (!story || story.slides.length === 0) return;
    if (slideIndex < 0 || slideIndex >= story.slides.length) return;
    this.sectorSlideIndex.update((arr) => {
      const next = [...arr];
      next[sectorIndex] = slideIndex;
      return next;
    });
  }

  pauseSectorAutoplay(): void {
    this.sectorAutoplayPaused = true;
  }

  resumeSectorAutoplay(): void {
    this.sectorAutoplayPaused = false;
  }

  onBrandLogoError(): void {
    this.brandLogoSrc.set('');
  }

  onSectorLogoError(sector: SectorStory): void {
    const stories = this.sectorStories();
    const index = stories.indexOf(sector);
    if (index < 0) return;
    this.sectorStories.update((arr) => {
      const next = [...arr];
      if (sector.name === "C'Shop" && sector.logoSrc !== this.defaultSectorLogo) {
        next[index] = { ...next[index], logoSrc: this.defaultSectorLogo, logoAlt: "Logo C'EMPIRE" };
      } else {
        next[index] = { ...next[index], logoSrc: undefined };
      }
      return next;
    });
  }

  resolveCampaignRoute(route: string): string {
    const trimmed = String(route || '').trim();
    if (!trimmed) return '/';
    if (/^(https?:)?\/\//i.test(trimmed)) return '/';
    if (/^javascript:/i.test(trimmed)) return '/';

    const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const root = `/${normalized.split('/').filter(Boolean)[0] ?? ''}`;
    if (normalized === '/') return '/';
    if (this.allowedRoutePrefixes.includes(root)) return normalized;
    return '/';
  }

  private startAutoplay(): void {
    if (this.heroSlides.length < 2) return;
    this.autoplayId = setInterval(() => this.nextSlide(), 4500);
  }

  private stopAutoplay(): void {
    if (!this.autoplayId) return;
    clearInterval(this.autoplayId);
    this.autoplayId = null;
  }

  private startSectorAutoplay(): void {
    this.sectorAutoplayId = setInterval(() => {
      if (this.sectorAutoplayPaused) return;
      const stories = this.sectorStories();
      this.sectorSlideIndex.update((arr) =>
        stories.map((story, i) => {
          const current = arr[i] ?? 0;
          if (story.slides.length < 2) return 0;
          return (current + 1) % story.slides.length;
        }),
      );
    }, 5000);
  }

  private stopSectorAutoplay(): void {
    if (!this.sectorAutoplayId) return;
    clearInterval(this.sectorAutoplayId);
    this.sectorAutoplayId = null;
  }

  private loadHomeContent(): void {
    this.contentPagesService.getPublicPage('home').subscribe({
      next: (page) => this.applyHomeContent(page),
      error: () => this.applyHomeContent(null),
    });
  }

  private loadHighlights(): void {
    this.featuredLoading.set(true);
    this.highlightsError.set(null);
    Promise.allSettled([
      fetch(buildApiUrl('/highlights/campaigns/public/active')),
      fetch(buildApiUrl('/highlights/news/public/active')),
    ])
      .then(async ([campaignsRes, newsRes]) => {
        const campaignsOk =
          campaignsRes.status === 'fulfilled' && campaignsRes.value.ok;
        const newsOk = newsRes.status === 'fulfilled' && newsRes.value.ok;

        const campaigns = campaignsOk ? await campaignsRes.value.json() : [];
        const news = newsOk ? await newsRes.value.json() : [];

        this.featuredCampaigns.set(this.normalizeCampaigns(campaigns));
        this.newsMessages.set(Array.isArray(news) ? news : []);

        if (!campaignsOk || !newsOk) {
          this.highlightsError.set(
            'Impossible de charger complètement les contenus "À la une / Actualités".',
          );
        }
      })
      .finally(() => {
        this.featuredLoading.set(false);
      });
  }

  private normalizeCampaigns(input: unknown): FeaturedCampaign[] {
    if (!Array.isArray(input)) return [];
    return input.map((campaign: Record<string, unknown>) => ({
      ...campaign,
      items: Array.isArray(campaign?.['items'])
        ? (campaign['items'] as Record<string, unknown>[]).map((item) => ({
            ...item,
            route: this.resolveCampaignRoute(String(item?.['route'] ?? '')),
            imageUrl: item?.['imageUrl']
              ? buildMediaUrl(String(item['imageUrl']))
              : undefined,
          }))
        : [],
    })) as FeaturedCampaign[];
  }

  private applyHomeContent(page: ContentPage | null): void {
    if (!page) return;

    const metadata =
      page.metadata && typeof page.metadata === 'object'
        ? (page.metadata as Record<string, unknown>)
        : {};
    const stats = Array.isArray(metadata['stats'])
      ? (metadata['stats'] as Array<Record<string, unknown>>)
          .map((item) => ({
            value: String(item?.['value'] ?? '').trim(),
            label: String(item?.['label'] ?? '').trim(),
          }))
          .filter((item) => item.value && item.label)
      : [];

    const current = this.homeContent();
    this.homeContent.set({
      eyebrow: String(metadata['eyebrow'] || current.eyebrow),
      heroTitle: page.heroTitle?.trim() || current.heroTitle,
      heroText: page.heroText?.trim() || current.heroText,
      primaryCtaLabel: page.ctaLabel?.trim() || current.primaryCtaLabel,
      primaryCtaUrl: page.ctaUrl?.trim() || current.primaryCtaUrl,
      secondaryCtaLabel:
        String(metadata['secondaryCtaLabel'] || '').trim() || current.secondaryCtaLabel,
      secondaryCtaUrl:
        String(metadata['secondaryCtaUrl'] || '').trim() || current.secondaryCtaUrl,
      stats: stats.length ? stats : current.stats,
      finalCtaTitle:
        String(metadata['finalCtaTitle'] || '').trim() || current.finalCtaTitle,
      finalCtaText:
        String(metadata['finalCtaText'] || '').trim() || current.finalCtaText,
      finalCtaLabel:
        String(metadata['finalCtaLabel'] || '').trim() || current.finalCtaLabel,
      finalCtaUrl:
        String(metadata['finalCtaUrl'] || '').trim() || current.finalCtaUrl,
    });
  }
}
