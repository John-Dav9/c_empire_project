import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.scss'
})
export class ClientDashboardComponent {
  cards = [
    {
      icon: '🛒',
      title: 'Mes Commandes',
      description: "Retrouvez vos articles et relancez un achat rapidement.",
      cta: 'Voir le panier',
      route: '/shop/cart',
    },
    {
      icon: '📅',
      title: 'Mes Réservations',
      description: "Explorez les offres events et suivez vos prochaines réservations.",
      cta: 'Suivre mes réservations',
      route: '/client/events/bookings',
    },
    {
      icon: '🎉',
      title: 'Promotions',
      description: 'Consultez les offres en cours et les produits mis en avant.',
      cta: 'Voir les offres',
      route: '/shop',
    },
    {
      icon: '✅',
      title: "Mes missions C'To-Do",
      description: 'Planifiez vos taches quotidiennes et suivez leur execution.',
      cta: 'Gerer mes missions',
      route: '/client/todo/requests',
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
