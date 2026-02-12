import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

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
  slides: SectorSlide[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  heroSlides: HeroSlide[] = [
    { src: '/media/hero-1.jpg', alt: 'Service traiteur et buffet en entreprise' },
    { src: '/media/hero-2.jpg', alt: 'Collaboration d equipe dans un espace de travail' },
    { src: '/media/hero-3.jpg', alt: 'Equipe celebrant un resultat sur ordinateur' }
  ];

  currentSlide = 0;
  sectorStories: SectorStory[] = [
    {
      name: "C'Shop",
      description: 'Du repérage au panier, vos achats deviennent simples, rapides et continus.',
      route: '/shop',
      ctaLabel: 'Découvrir la boutique',
      slides: [
        { src: '/media/cshop-1.jpg', title: 'Vitrine premium', subtitle: 'Une entrée visuelle claire qui attire et rassure.' },
        { src: '/media/cshop-2.jpg', title: 'Rayons complets', subtitle: 'Une offre large pour couvrir tous les besoins.' },
        { src: '/media/cshop-3.jpg', title: 'Achat plaisir', subtitle: 'Mode et lifestyle intégrés au parcours client.' },
        { src: '/media/cshop-4.jpg', title: 'Collection en magasin', subtitle: 'Des espaces modernes pour valoriser les produits.' },
        { src: '/media/cshop-5.jpg', title: 'Sélection experte', subtitle: 'Des articles premium mis en avant intelligemment.' },
        { src: '/media/cshop-6.jpg', title: 'Offres visibles', subtitle: 'Promotions et signalétiques pour accélérer la décision.' },
        { src: '/media/cshop-7.jpg', title: 'Invitation à l’achat', subtitle: 'Un message simple: entrer, explorer, commander.' }
      ]
    },
    {
      name: "C'Grill & Food",
      description: 'Une expérience food claire: menu, choix, confirmation et préparation.',
      route: '/grill',
      ctaLabel: 'Commander au grill',
      slides: [
        { src: '/media/cgrill-1.jpg', title: 'Assiette signature', subtitle: 'Des plats premium présentés avec précision.' },
        { src: '/media/cgrill-2.jpg', title: 'Sélection du chef', subtitle: 'Textures, épices et dressage au centre de l’expérience.' },
        { src: '/media/cgrill-3.jpg', title: 'Pièces grillées', subtitle: 'Cuisson maîtrisée et saveurs intenses.' },
        { src: '/media/cgrill-4.jpg', title: 'Option healthy', subtitle: 'Bols frais et équilibrés pour tous les profils.' },
        { src: '/media/cgrill-5.jpg', title: 'Feu vif', subtitle: 'Le grill monte en température, la cuisine s’active.' },
        { src: '/media/cgrill-6.jpg', title: 'Service live', subtitle: 'Brochettes et grillades prêtes à être servies.' },
        { src: '/media/cgrill-7.jpg', title: 'Saveur fumée', subtitle: 'La signature barbecue qui marque la différence.' },
        { src: '/media/cgrill-8.jpg', title: 'Maîtrise du geste', subtitle: 'Chaque cuisson suit un standard de qualité constant.' }
      ]
    },
    {
      name: "C'Express",
      description: 'Une logistique connectée pour envoyer et recevoir sans perte de temps.',
      route: '/express',
      ctaLabel: "Lancer une livraison",
      slides: [
        { src: '/media/cexpress-1.jpg', title: 'Course lancée', subtitle: 'Les livreurs prennent la route immédiatement.' },
        { src: '/media/cexpress-2.jpg', title: 'Chargement en cours', subtitle: 'Les colis sont triés et préparés pour départ.' },
        { src: '/media/cexpress-3.jpg', title: 'Capacité optimisée', subtitle: 'Chaque véhicule maximise les tournées.' },
        { src: '/media/cexpress-4.jpg', title: 'Acheminement rapide', subtitle: 'Livraison active avec suivi de bout en bout.' },
        { src: '/media/cexpress-5.jpg', title: 'Dernier kilomètre', subtitle: 'Le colis arrive vite chez le destinataire.' }
      ]
    },
    {
      name: "C'Clean",
      description: 'Planifiez, assignez et suivez les interventions de nettoyage avec précision.',
      route: '/clean',
      ctaLabel: 'Réserver un service',
      slides: [
        { src: '/media/cclean-1.jpg', title: 'Surfaces sensibles', subtitle: 'Nettoyage précis avec protection adaptée.' },
        { src: '/media/cclean-2.jpg', title: 'Produits maîtrisés', subtitle: 'Solutions ciblées selon chaque zone.' },
        { src: '/media/cclean-3.jpg', title: 'Intervention hôtelière', subtitle: 'Équipes équipées pour les grands volumes.' },
        { src: '/media/cclean-4.jpg', title: 'Textiles et assises', subtitle: 'Aspiration profonde et finition propre.' },
        { src: '/media/cclean-5.jpg', title: 'Sols impeccables', subtitle: 'Traitement minutieux des surfaces étendues.' },
        { src: '/media/cclean-6.jpg', title: 'Désinfection active', subtitle: 'Pulvérisation contrôlée et essuyage sûr.' },
        { src: '/media/cclean-7.jpg', title: 'Bureaux et postes', subtitle: 'Hygiène quotidienne en environnement pro.' },
        { src: '/media/cclean-8.jpg', title: 'Entretien intensif', subtitle: 'Nettoyage renforcé pour zones critiques.' },
        { src: '/media/cclean-9.jpg', title: 'Remise en état', subtitle: 'Résultat net, contrôlé et vérifiable.' }
      ]
    },
    {
      name: "C'Events",
      description: 'Créez des événements mémorables avec un parcours de réservation sans effort.',
      route: '/events',
      ctaLabel: "Voir les événements",
      slides: [
        { src: '/media/hero-1.jpg', title: 'Programme en ligne', subtitle: 'Agenda lisible et inscription immédiate.' },
        { src: '/media/hero-3.jpg', title: 'Participants engagés', subtitle: 'Suivi des présences et interactions.' },
        { src: '/media/hero-2.jpg', title: 'Retour d’expérience', subtitle: 'Mesurez l’impact après chaque événement.' }
      ]
    },
    {
      name: "C'Todo",
      description: 'Vos tâches, vos équipes et vos priorités alignées dans un seul flux.',
      route: '/todo',
      ctaLabel: 'Gérer mes tâches',
      slides: [
        { src: '/media/hero-2.jpg', title: 'Plan du jour', subtitle: 'Priorités visibles pour toute l’équipe.' },
        { src: '/media/hero-3.jpg', title: 'Exécution suivie', subtitle: 'Statuts et blocages remontent immédiatement.' },
        { src: '/media/hero-1.jpg', title: 'Objectif atteint', subtitle: 'Clôture rapide et reporting propre.' }
      ]
    }
  ];
  sectorSlideIndex: number[] = [];
  private autoplayId: ReturnType<typeof setInterval> | null = null;
  private sectorAutoplayId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.startAutoplay();
    this.sectorSlideIndex = this.sectorStories.map(() => 0);
    this.startSectorAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
    this.stopSectorAutoplay();
  }

  nextSlide(): void {
    if (this.heroSlides.length < 2) return;
    this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length;
  }

  sectorTransform(sectorIndex: number): string {
    const index = this.sectorSlideIndex[sectorIndex] ?? 0;
    return `translateX(-${index * 100}%)`;
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
      this.sectorSlideIndex = this.sectorStories.map((story, index) => {
        const current = this.sectorSlideIndex[index] ?? 0;
        if (story.slides.length < 2) return 0;
        return (current + 1) % story.slides.length;
      });
    }, 5000);
  }

  private stopSectorAutoplay(): void {
    if (!this.sectorAutoplayId) return;
    clearInterval(this.sectorAutoplayId);
    this.sectorAutoplayId = null;
  }
}
