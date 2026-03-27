import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OrderStatus } from './order-status.enum';
import { OrderItem } from './order-item.entity';
import { User } from '../../auth/entities/user.entity';

export enum DeliveryOption {
  CEXPRESS = 'cexpress',   // Livraison C'Express (tarif calculé dynamiquement)
  FREE = 'free',           // Livraison gratuite
  RELAY = 'relay',         // Retrait dans un point relais
  WAREHOUSE = 'warehouse', // Retrait en entrepôt
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Indexé pour accélérer les requêtes "mes commandes" (findUserOrders)
  @Index()
  @Column()
  userId: string;

  // cascade:true → les OrderItems sont sauvegardés/supprimés avec la commande
  // eager:true → les items sont toujours chargés automatiquement avec la commande
  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];

  // Montant hors frais de livraison, après application de la remise promo
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  // Code promo appliqué (stocké pour affichage dans l'historique)
  @Column({ nullable: true })
  promoCode?: string;

  // Montant de la remise appliquée (0 si pas de promo)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  promoDiscount: number;

  // Indexé pour filtrer les commandes par statut (dashboard admin)
  @Index()
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING, // Toutes les commandes commencent à PENDING
  })
  status: OrderStatus;

  // Méthode de paiement utilisée (stripe, orange_money, etc.) — renseigné après paiement
  @Column({ nullable: true })
  paymentMethod?: string;

  // Mode de livraison choisi par le client au checkout
  @Column({ type: 'enum', enum: DeliveryOption, default: DeliveryOption.FREE })
  deliveryOption: DeliveryOption;

  // Frais de livraison calculés (0 pour FREE, RELAY et WAREHOUSE ; tarif C'Express sinon)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  // Adresse de livraison saisie par le client (requis pour C'Express)
  @Column({ nullable: true })
  deliveryAddress?: string;

  // ID du point relais choisi (requis si deliveryOption === RELAY)
  @Column({ type: 'uuid', nullable: true })
  relayPointId?: string | null;

  // Passe à true quand le paiement est confirmé — déclenché par handlePaymentSuccess()
  @Column({ default: false })
  isPaid: boolean;

  // Statut de la livraison (indépendant du statut de paiement)
  // pending → quoted → assigned (livreur assigné) → picked (collecté) → delivered | cancelled
  @Column({ default: 'pending' })
  deliveryStatus:
    | 'pending'
    | 'quoted'
    | 'assigned'
    | 'picked'
    | 'delivered'
    | 'cancelled';

  // Note libre du client (instructions de livraison, etc.)
  @Column({ nullable: true })
  note?: string;

  // Employés assignés à cette commande (relation N-N : un employé peut gérer plusieurs commandes)
  @ManyToMany(() => User, { eager: false })
  @JoinTable({ name: 'order_assignees' })
  assignees: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
