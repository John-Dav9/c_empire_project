import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.scss'
})
export class ClientDashboardComponent {
  readonly cards = [
    {
      icon: '📦',
      title: 'Mes Commandes C\'Shop',
      description: 'Suivez vos commandes, consultez votre historique et téléchargez vos factures.',
      cta: 'Voir mes commandes',
      route: '/client/shop/orders',
    },
    {
      icon: '🛒',
      title: 'Boutique',
      description: 'Parcourez le catalogue C\'Shop et ajoutez des produits à votre panier.',
      cta: 'Aller à la boutique',
      route: '/shop',
    },
    {
      icon: '📅',
      title: 'Mes Réservations C\'Events',
      description: 'Explorez les offres événements et suivez vos prochaines réservations.',
      cta: 'Voir mes réservations',
      route: '/client/events/bookings',
    },
    {
      icon: '✅',
      title: "Mes missions C'To-Do",
      description: 'Planifiez vos tâches quotidiennes et suivez leur exécution.',
      cta: 'Gérer mes missions',
      route: '/client/todo/requests',
    },
    {
      icon: '🍖',
      title: "Mes Commandes C'Grill",
      description: "Consultez vos commandes de restauration et suivez leur préparation.",
      cta: 'Voir mes commandes',
      route: '/client/grill/orders',
    },
    {
      icon: '🧹',
      title: "Mes Réservations C'Clean",
      description: "Suivez vos réservations de nettoyage et leur avancement.",
      cta: 'Voir mes réservations',
      route: '/client/clean/bookings',
    },
    {
      icon: '🚴',
      title: "Mes Livraisons C'Express",
      description: "Suivez vos livraisons et demandes d'import/export en temps réel.",
      cta: 'Voir mes livraisons',
      route: '/express/my-deliveries',
    },
    {
      icon: '👤',
      title: 'Mon Profil',
      description: 'Mettez à jour vos informations personnelles et préférences.',
      cta: 'Gérer mon profil',
      route: '/profile',
    },
  ];
}
