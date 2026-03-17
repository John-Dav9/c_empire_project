import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { GrillMenuPack } from './grill-menu-pack.entity';

@Entity('grill_menu_pack_items')
export class GrillMenuPackItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GrillMenuPack, (p) => p.items, { onDelete: 'CASCADE' })
  pack: GrillMenuPack;

  @Column()
  productId: string; // GrillProduct.id

  @Column({ type: 'int', default: 1 })
  qty: number;
}
