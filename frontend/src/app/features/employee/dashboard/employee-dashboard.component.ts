import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

type TodoMissionStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

type TodoMission = {
  id: string;
  serviceTitle: string;
  status: TodoMissionStatus;
  scheduledAt?: string;
  address?: string;
};

type EmployeeCard = {
  icon: string;
  title: string;
  description: string;
  cta: string;
  route?: string;
  badge?: string;
  metric?: string;
};

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './employee-dashboard.component.html',
  styleUrl: './employee-dashboard.component.scss',
})
export class EmployeeDashboardComponent implements OnInit {
  loading = true;
  error: string | null = null;
  cards: EmployeeCard[] = [];

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading = true;
    this.error = null;

    this.api.get<TodoMission[]>('/c-todo/orders/missions').subscribe({
      next: (missions) => {
        const safeMissions = Array.isArray(missions) ? missions : [];
        const pending = safeMissions.filter((item) => item.status === 'pending').length;
        const active = safeMissions.filter(
          (item) => item.status === 'confirmed' || item.status === 'in_progress',
        ).length;
        const completed = safeMissions.filter((item) => item.status === 'completed').length;

        this.cards = [
          {
            icon: '📋',
            title: "Missions C'Todo",
            description:
              'Consultez les missions disponibles et mettez a jour leur avancement.',
            cta: 'Voir mes missions',
            route: '/employee/todo/missions',
            badge: 'Actif',
            metric: `${safeMissions.length} total`,
          },
          {
            icon: '⏳',
            title: 'A traiter',
            description:
              'Missions en attente de prise en charge ou de confirmation.',
            cta: 'Voir les missions',
            route: '/employee/todo/missions',
            badge: pending > 0 ? 'Priorite' : 'Stable',
            metric: `${pending} en attente`,
          },
          {
            icon: '⚙️',
            title: 'En cours',
            description:
              'Interventions deja confirmees ou actuellement executees.',
            cta: 'Suivre les interventions',
            route: '/employee/todo/missions',
            badge: active > 0 ? 'Terrain' : 'Calme',
            metric: `${active} actives`,
          },
          {
            icon: '✅',
            title: 'Historique recent',
            description:
              'Missions terminees avec succes sur votre file de travail.',
            cta: 'Ouvrir le profil',
            route: '/profile',
            badge: 'Suivi',
            metric: `${completed} terminees`,
          },
        ];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message ||
          'Impossible de charger le tableau de bord employe.';
        this.cards = [
          {
            icon: '📋',
            title: "Missions C'Todo",
            description:
              'Accedez directement aux missions disponibles pour reprendre votre activite.',
            cta: 'Voir mes missions',
            route: '/employee/todo/missions',
            badge: 'Actif',
          },
          {
            icon: '👤',
            title: 'Mon profil',
            description:
              'Verifiez vos informations personnelles et vos acces.',
            cta: 'Ouvrir le profil',
            route: '/profile',
            badge: 'Actif',
          },
        ];
      },
    });
  }
}
