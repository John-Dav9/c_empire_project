import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { GrillOrder } from './grill-order.entity';

@Entity('grill_order_items')
export class GrillOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GrillOrder, (order) => order.items, { onDelete: 'CASCADE' })
  order: GrillOrder;

  @Column()
  productId: string;

  // Snapshots (ne changent jamais)
  @Column({ length: 120 })
  titleSnapshot: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPriceSnapshot: number;

  @Column({ type: 'int' })
  qty: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  lineTotal: number;
}
