import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { AppModule } from './app.module';
import { Sector } from './core/sectors/entities/sector.entity';
import { Product } from './shop/product/product.entity';
import { GrillProduct } from './grill/entities/grill-product.entity';
import { CleanServiceEntity } from './clean/entities/clean-service.entity';
import { CleanServiceType } from './clean/enums/clean-service-type.enum';
import { TodoService } from './todo/entities/todo-service.entity';
import { Event } from './events/entities/event.entity';
import { EventCategory } from './events/enums/event-category.enum';
import { CourierEntity } from './express/entities/courier.entity';
import { DeliveryEntity } from './express/entities/delivery.entity';
import { DeliveryStatus } from './express/enums/delivery-status.enum';
import { User } from './auth/entities/user.entity';
import { UserRole } from './auth/enums/user-role.enum';
import { Order } from './shop/order/order.entity';
import { OrderItem } from './shop/order/order-item.entity';
import { OrderStatus } from './shop/order/order-status.enum';
import { DeliveryOption } from './shop/order/order.entity';
import { GrillOrder } from './grill/entities/grill-order.entity';
import { GrillOrderItem } from './grill/entities/grill-order-item.entity';
import { GrillOrderStatus } from './grill/enums/grill-order-status.enum';
import { GrillDeliveryMode } from './grill/enums/grill-delivery-mode.enum';
import { CleanBooking } from './clean/entities/clean-booking.entity';
import { CleanBookingStatus } from './clean/enums/clean-booking-status.enum';
import { TodoOrder } from './todo/entities/todo-order.entity';
import { TodoOrderStatus } from './todo/enums/todo-order-status.enum';
import { EventBooking } from './events/entities/event-booking.entity';
import { EventBookingStatus } from './events/enums/event-booking-status.enum';
import { Payment } from './core/payments/payment.entity';
import { PaymentProvider } from './core/payments/providers/payment-provider.enum';
import { PaymentStatus } from './core/payments/payment-status.enum';
import { PaymentReferenceType } from './core/payments/payment-reference-type.enum';

function intEnv(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : defaultValue;
}

function boolEnv(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase());
}

function pick<T>(values: T[], index: number): T {
  return values[index % values.length];
}

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureSector(
  sectorRepo: Repository<Sector>,
  name: string,
  code: string,
  description: string,
): Promise<Sector> {
  const existing =
    (await sectorRepo.findOne({ where: { code } })) ??
    (await sectorRepo.findOne({ where: { name } }));

  if (existing) {
    if (!existing.code || !existing.description) {
      existing.code = existing.code || code;
      existing.description = existing.description || description;
      return sectorRepo.save(existing);
    }
    return existing;
  }

  return sectorRepo.save(
    sectorRepo.create({
      name,
      code,
      description,
      isActive: true,
    }),
  );
}

async function ensureDemoUser(userRepo: Repository<User>): Promise<User> {
  const existing = await userRepo.findOne({
    where: { email: 'demo.client@cempire.com' },
  });
  if (existing) return existing;

  const hashed = await bcrypt.hash('DemoClient#2026', 10);
  return userRepo.save(
    userRepo.create({
      email: 'demo.client@cempire.com',
      password: hashed,
      firstname: 'Demo',
      lastname: 'Client',
      phone: '+237600000001',
      role: UserRole.CLIENT,
      isActive: true,
    }),
  );
}

async function seedShopProducts(
  productRepo: Repository<Product>,
  shopSectorId: string,
  count: number,
  reset: boolean,
): Promise<number> {
  if (reset) {
    await productRepo
      .createQueryBuilder()
      .delete()
      .where('slug LIKE :prefix', { prefix: 'demo-cshop-%' })
      .execute();
  }

  const categories = [
    'Electronique',
    'Electro-menager',
    'Maison',
    'Mode',
    'Sante',
    'Bebe',
    'Bureau',
    'Auto',
    'Sport',
    'Cuisine',
    'Enfants',
    'Jardin',
    'Fetes',
    'Animaux',
    'Loisirs',
    'Beaute',
    'Multimedia',
    'Femme',
    'Homme',
    'Hiver',
    'Ete',
    'Accessoires',
    'Informatique',
  ];
  const adjectives = [
    'Premium',
    'Smart',
    'Compact',
    'Pro',
    'Eco',
    'Plus',
    'Ultra',
    'Max',
    'Essential',
    'Elite',
  ];
  const nouns = [
    'Pack',
    'Kit',
    'Station',
    'Set',
    'Solution',
    'Bundle',
    'Serie',
    'Edition',
    'Model',
    'Collection',
  ];

  const records: Product[] = [];
  for (let i = 1; i <= count; i++) {
    const category = pick(categories, i);
    const name = `CShop ${pick(adjectives, i)} ${pick(nouns, i * 3)} ${String(i).padStart(3, '0')}`;
    const slug = `demo-cshop-${String(i).padStart(4, '0')}-${slugify(name)}`;
    const price = 2500 + ((i * 137) % 145000);
    const promoPrice = i % 5 === 0 ? Number((price * 0.9).toFixed(2)) : null;
    const technicalSheetPdf =
      category === 'Electronique' || category === 'Electro-menager'
        ? `/uploads/products/demo-tech-sheet-${String(i).padStart(4, '0')}.pdf`
        : null;

    records.push(
      productRepo.create({
        name,
        slug,
        description: `Produit de test ${name} pour la validation des parcours catalogue, panier et paiement.`,
        price,
        promoPrice,
        currency: 'XAF',
        stock: 20 + (i % 180),
        isActive: true,
        categories: [category],
        images: [`/media/demo/shop/${(i % 18) + 1}.jpg`],
        technicalSheetPdf,
        sku: `CSH-${String(i).padStart(6, '0')}`,
        sectorId: shopSectorId,
      }),
    );
  }

  await productRepo.save(records, { chunk: 100 });
  return records.length;
}

async function seedGrillProducts(
  grillRepo: Repository<GrillProduct>,
  count: number,
  reset: boolean,
): Promise<number> {
  if (reset) {
    await grillRepo
      .createQueryBuilder()
      .delete()
      .where('title LIKE :prefix', { prefix: '[DEMO] %' })
      .execute();
  }

  const categories = [
    'grillades',
    'brochettes',
    'burgers',
    'poulet',
    'poisson',
    'accompagnements',
    'boissons',
    'desserts',
  ];
  const flavors = [
    'Braise',
    'Piment',
    'Herbes',
    'Fume',
    'Miel',
    'Yassa',
    'Sucre-sale',
    'Soya',
  ];

  const records: GrillProduct[] = [];
  for (let i = 1; i <= count; i++) {
    const category = pick(categories, i);
    const title = `[DEMO] CGrill ${pick(flavors, i)} ${String(i).padStart(3, '0')}`;
    const price = 1800 + ((i * 89) % 26000);
    const promoPrice = i % 6 === 0 ? Number((price * 0.88).toFixed(2)) : null;

    records.push(
      grillRepo.create({
        title,
        description: `Produit grill de demonstration ${title} pour tester menu, commande et suivi cuisine.`,
        price,
        currency: 'XAF',
        category,
        isAvailable: true,
        stockQty: 15 + (i % 90),
        images: [`/media/demo/grill/${(i % 16) + 1}.jpg`],
        promoPrice: promoPrice ?? undefined,
        isFeatured: i % 9 === 0,
        tags: [category, 'demo', 'test-charge'],
        prepTimeMin: 10 + (i % 35),
      }),
    );
  }

  await grillRepo.save(records, { chunk: 100 });
  return records.length;
}

async function seedCleanServices(
  cleanRepo: Repository<CleanServiceEntity>,
  count: number,
  reset: boolean,
): Promise<number> {
  if (reset) {
    await cleanRepo
      .createQueryBuilder()
      .delete()
      .where('title LIKE :prefix', { prefix: '[DEMO] %' })
      .execute();
  }

  const types = Object.values(CleanServiceType);
  const places = ['Appartement', 'Villa', 'Bureau', 'Commerce', 'Hotel'];

  const records: CleanServiceEntity[] = [];
  for (let i = 1; i <= count; i++) {
    const type = pick(types, i);
    const title = `[DEMO] CClean ${type} ${pick(places, i)} ${String(i).padStart(3, '0')}`;
    records.push(
      cleanRepo.create({
        title,
        description: `Service ${type} pour tests de reservation, devis et assignation equipe.`,
        type,
        isActive: true,
        basePrice: 7000 + ((i * 173) % 95000),
        currency: 'XAF',
        estimatedDurationMin: 45 + (i % 240),
        imageUrl: `/media/demo/clean/${(i % 12) + 1}.jpg`,
      }),
    );
  }

  await cleanRepo.save(records, { chunk: 100 });
  return records.length;
}

async function seedTodoServices(
  todoRepo: Repository<TodoService>,
  count: number,
  reset: boolean,
): Promise<number> {
  if (reset) {
    await todoRepo
      .createQueryBuilder()
      .delete()
      .where('title LIKE :prefix', { prefix: '[DEMO] %' })
      .execute();
  }

  const tasks = [
    'Courses',
    'Repassage',
    'Montage meuble',
    'Demarches administratives',
    'Assistance numerique',
    'Livraison personnelle',
    'Jardinage',
    'Pet-sitting',
  ];

  const records: TodoService[] = [];
  for (let i = 1; i <= count; i++) {
    const task = pick(tasks, i);
    records.push(
      todoRepo.create({
        title: `[DEMO] CTodo ${task} ${String(i).padStart(3, '0')}`,
        description: `Service CTodo de demonstration pour tester creation commande et suivi execution (${task}).`,
        basePrice: 3500 + ((i * 121) % 38000),
        isActive: true,
      }),
    );
  }

  await todoRepo.save(records, { chunk: 100 });
  return records.length;
}

async function seedEvents(
  eventRepo: Repository<Event>,
  count: number,
  reset: boolean,
): Promise<number> {
  if (reset) {
    await eventRepo
      .createQueryBuilder()
      .delete()
      .where('title LIKE :prefix', { prefix: '[DEMO] %' })
      .execute();
  }

  const categories = Object.values(EventCategory);
  const formats = ['Pack Basic', 'Pack Plus', 'Pack Premium', 'Pack Gold'];

  const records: Event[] = [];
  for (let i = 1; i <= count; i++) {
    const category = pick(categories, i);
    const title = `[DEMO] CEvents ${category} ${pick(formats, i)} ${String(i).padStart(3, '0')}`;
    records.push(
      eventRepo.create({
        title,
        description: `Offre evenementielle ${category} pour tests de vitrine, reservation et pricing.`,
        category,
        basePrice: 25000 + ((i * 777) % 450000),
        isActive: true,
        images: [`/media/demo/events/${(i % 12) + 1}.jpg`],
      }),
    );
  }

  await eventRepo.save(records, { chunk: 100 });
  return records.length;
}

async function seedExpressOps(
  courierRepo: Repository<CourierEntity>,
  deliveryRepo: Repository<DeliveryEntity>,
  userId: string,
  courierCount: number,
  deliveryCount: number,
  reset: boolean,
): Promise<{ couriers: number; deliveries: number }> {
  if (reset) {
    await deliveryRepo
      .createQueryBuilder()
      .delete()
      .where('adminNote LIKE :prefix', { prefix: '[DEMO]%' })
      .orWhere('customerNote LIKE :prefix', { prefix: '[DEMO]%' })
      .execute();

    await courierRepo
      .createQueryBuilder()
      .delete()
      .where('adminNote LIKE :prefix', { prefix: '[DEMO]%' })
      .execute();
  }

  const vehicles = ['moto', 'voiture', 'velo', 'camion'];
  const cities = ['Douala', 'Yaounde', 'Bafoussam', 'Kribi'];

  const couriers: CourierEntity[] = [];
  for (let i = 1; i <= courierCount; i++) {
    couriers.push(
      courierRepo.create({
        fullName: `Livreur Demo ${String(i).padStart(3, '0')}`,
        phone: `+23769${String(1000000 + i).slice(-7)}`,
        vehicleType: pick(vehicles, i),
        available: i % 4 !== 0,
        city: pick(cities, i),
        country: 'CM',
        adminNote: '[DEMO] courier seed',
      }),
    );
  }
  await courierRepo.save(couriers, { chunk: 100 });

  const statuses = Object.values(DeliveryStatus);
  const zones = [
    'Akwa',
    'Bonapriso',
    'Bastos',
    'Melen',
    'Bonamoussadi',
    'Odza',
  ];
  const packageTypes = ['document', 'food', 'parcel', 'fragile', 'medical'];
  const savedCourierIds = (await courierRepo.find({ take: courierCount })).map(
    (x) => x.id,
  );

  const deliveries: DeliveryEntity[] = [];
  for (let i = 1; i <= deliveryCount; i++) {
    const price = 1500 + ((i * 63) % 18000);
    const status = pick(statuses, i);
    const courierId =
      status === DeliveryStatus.PENDING ? undefined : pick(savedCourierIds, i);

    deliveries.push(
      deliveryRepo.create({
        userId,
        pickupAddress: `Rue ${pick(zones, i)} #${i}`,
        deliveryAddress: `Avenue ${pick(zones, i * 2)} #${i + 10}`,
        packageType: pick(packageTypes, i),
        weightKg: Number((0.3 + (i % 25) * 0.4).toFixed(1)),
        distanceKm: Number((1.5 + (i % 28) * 0.9).toFixed(2)),
        urgencyLevel: (i % 3) + 1,
        price,
        paid: i % 5 !== 0,
        courierId,
        status,
        customerNote: '[DEMO] livraison test',
        adminNote: '[DEMO] express seed',
      }),
    );
  }
  await deliveryRepo.save(deliveries, { chunk: 100 });

  return {
    couriers: couriers.length,
    deliveries: deliveries.length,
  };
}

async function seedShopOrders(
  orderRepo: Repository<Order>,
  productRepo: Repository<Product>,
  paymentRepo: Repository<Payment>,
  user: User,
  count: number,
  reset: boolean,
): Promise<number> {
  if (reset) {
    await paymentRepo
      .createQueryBuilder()
      .delete()
      .where('referenceType = :type', { type: PaymentReferenceType.SHOP_ORDER })
      .execute();
    await orderRepo
      .createQueryBuilder()
      .delete()
      .where('note LIKE :prefix', { prefix: '[DEMO]%' })
      .execute();
  }

  const products = await productRepo
    .createQueryBuilder('p')
    .where('p.slug LIKE :prefix', { prefix: 'demo-cshop-%' })
    .take(Math.max(20, Math.min(250, count)))
    .getMany();

  if (products.length === 0) return 0;

  const statuses = Object.values(OrderStatus);
  const providers = [
    PaymentProvider.MTN_MOMO,
    PaymentProvider.ORANGE_MONEY,
    PaymentProvider.WALLET,
    PaymentProvider.CARD,
  ];

  let created = 0;
  for (let i = 1; i <= count; i++) {
    const lineCount = 1 + (i % 4);
    const items: OrderItem[] = [];
    let subtotal = 0;

    for (let j = 0; j < lineCount; j++) {
      const product = pick(products, i * (j + 2));
      const qty = 1 + ((i + j) % 3);
      const unitPrice = Number(product.price);
      subtotal += unitPrice * qty;
      items.push(
        Object.assign(new OrderItem(), {
          productId: product.id,
          productName: product.name,
          unitPrice,
          quantity: qty,
        }),
      );
    }

    const deliveryOption =
      i % 3 === 0 ? DeliveryOption.CEXPRESS : DeliveryOption.OTHER;
    const deliveryFee = deliveryOption === DeliveryOption.CEXPRESS ? 1500 : 0;
    const promoDiscount =
      i % 5 === 0 ? Number((subtotal * 0.08).toFixed(2)) : 0;
    const totalAmount = Number(
      Math.max(500, subtotal + deliveryFee - promoDiscount).toFixed(2),
    );
    const status = pick(statuses, i);
    const isPaid = [
      OrderStatus.PAID,
      OrderStatus.PREPARING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.REFUNDED,
    ].includes(status);

    const order = await orderRepo.save(
      orderRepo.create({
        userId: user.id,
        items,
        totalAmount,
        promoCode: promoDiscount > 0 ? 'DEMO8' : undefined,
        promoDiscount,
        status,
        paymentMethod: isPaid ? 'mobile_money' : undefined,
        deliveryOption,
        deliveryFee,
        deliveryAddress:
          deliveryOption === DeliveryOption.CEXPRESS
            ? `Douala, Zone ${1 + (i % 15)}`
            : undefined,
        isPaid,
        deliveryStatus: isPaid ? 'delivered' : 'pending',
        note: `[DEMO] shop order ${String(i).padStart(4, '0')}`,
      }),
    );

    if (isPaid) {
      await paymentRepo.save(
        paymentRepo.create({
          user,
          amount: Math.round(totalAmount),
          currency: 'XAF',
          provider: pick(providers, i),
          status: PaymentStatus.SUCCESS,
          providerTransactionId: `DEMO-SHOP-${String(i).padStart(6, '0')}`,
          referenceType: PaymentReferenceType.SHOP_ORDER,
          referenceId: order.id,
          orderId: order.id,
        }),
      );
    }
    created++;
  }

  return created;
}

async function seedGrillOrders(
  grillOrderRepo: Repository<GrillOrder>,
  grillProductRepo: Repository<GrillProduct>,
  paymentRepo: Repository<Payment>,
  user: User,
  count: number,
  reset: boolean,
): Promise<number> {
  if (reset) {
    await paymentRepo
      .createQueryBuilder()
      .delete()
      .where('referenceType = :type', {
        type: PaymentReferenceType.GRILLFOOD_ORDER,
      })
      .execute();
    await grillOrderRepo
      .createQueryBuilder()
      .delete()
      .where('fullName LIKE :prefix', { prefix: '[DEMO]%' })
      .execute();
  }

  const products = await grillProductRepo
    .createQueryBuilder('p')
    .where('p.title LIKE :prefix', { prefix: '[DEMO]%' })
    .take(Math.max(20, Math.min(220, count)))
    .getMany();

  if (products.length === 0) return 0;

  const statuses = Object.values(GrillOrderStatus);
  const providers = [
    PaymentProvider.MTN_MOMO,
    PaymentProvider.ORANGE_MONEY,
    PaymentProvider.WALLET,
  ];
  let created = 0;

  for (let i = 1; i <= count; i++) {
    const lineCount = 1 + (i % 3);
    const items: GrillOrderItem[] = [];
    let subtotal = 0;
    for (let j = 0; j < lineCount; j++) {
      const product = pick(products, i * (j + 3));
      const qty = 1 + ((i + j) % 2);
      const unit = Number(product.promoPrice ?? product.price);
      const lineTotal = Number((unit * qty).toFixed(2));
      subtotal += lineTotal;
      items.push(
        Object.assign(new GrillOrderItem(), {
          productId: product.id,
          titleSnapshot: product.title,
          unitPriceSnapshot: unit,
          qty,
          lineTotal,
        }),
      );
    }

    const deliveryMode =
      i % 2 === 0 ? GrillDeliveryMode.DELIVERY : GrillDeliveryMode.PICKUP;
    const deliveryFee = deliveryMode === GrillDeliveryMode.DELIVERY ? 1000 : 0;
    const total = Number((subtotal + deliveryFee).toFixed(2));
    const status = pick(statuses, i);
    const paidStatuses = [
      GrillOrderStatus.PAID,
      GrillOrderStatus.CONFIRMED,
      GrillOrderStatus.PREPARING,
      GrillOrderStatus.READY,
      GrillOrderStatus.OUT_FOR_DELIVERY,
      GrillOrderStatus.DELIVERED,
    ];

    const order = await grillOrderRepo.save(
      grillOrderRepo.create({
        fullName: `[DEMO] Client Grill ${String(i).padStart(3, '0')}`,
        email: `demo.grill${String(i).padStart(3, '0')}@cempire.com`,
        phone: `+23767${String(1000000 + i).slice(-7)}`,
        deliveryMode,
        address:
          deliveryMode === GrillDeliveryMode.DELIVERY
            ? `Douala, Quartier ${1 + (i % 12)}`
            : undefined,
        subtotal,
        deliveryFee,
        total,
        currency: 'XAF',
        status,
        items,
      }),
    );

    if (paidStatuses.includes(status)) {
      const payment = await paymentRepo.save(
        paymentRepo.create({
          user,
          amount: Math.round(total),
          currency: 'XAF',
          provider: pick(providers, i),
          status: PaymentStatus.SUCCESS,
          providerTransactionId: `DEMO-GRILL-${String(i).padStart(6, '0')}`,
          referenceType: PaymentReferenceType.GRILLFOOD_ORDER,
          referenceId: order.id,
        }),
      );
      order.paymentId = payment.id;
      await grillOrderRepo.save(order);
    }
    created++;
  }

  return created;
}

async function seedCleanBookings(
  cleanBookingRepo: Repository<CleanBooking>,
  cleanServiceRepo: Repository<CleanServiceEntity>,
  paymentRepo: Repository<Payment>,
  user: User,
  count: number,
  reset: boolean,
): Promise<number> {
  if (reset) {
    await paymentRepo
      .createQueryBuilder()
      .delete()
      .where('referenceType = :type', {
        type: PaymentReferenceType.CLEAN_BOOKING,
      })
      .execute();
    await cleanBookingRepo
      .createQueryBuilder()
      .delete()
      .where('notes LIKE :prefix', { prefix: '[DEMO]%' })
      .execute();
  }

  const services = await cleanServiceRepo
    .createQueryBuilder('s')
    .where('s.title LIKE :prefix', { prefix: '[DEMO]%' })
    .take(Math.max(15, Math.min(120, count)))
    .getMany();
  if (services.length === 0) return 0;

  const statuses = Object.values(CleanBookingStatus);
  const providers = [PaymentProvider.MTN_MOMO, PaymentProvider.ORANGE_MONEY];
  let created = 0;

  for (let i = 1; i <= count; i++) {
    const service = pick(services, i);
    const status = pick(statuses, i);
    const amount = Number(service.basePrice);
    const scheduled = new Date(Date.now() + (i - 20) * 86400000);
    const booking = await cleanBookingRepo.save(
      cleanBookingRepo.create({
        user,
        fullName: `[DEMO] Client Clean ${String(i).padStart(3, '0')}`,
        email: `demo.clean${String(i).padStart(3, '0')}@cempire.com`,
        phone: `+23765${String(1000000 + i).slice(-7)}`,
        cleanServiceId: service.id,
        serviceTitle: service.title,
        amount,
        currency: 'XAF',
        address: `Yaounde, Bloc ${1 + (i % 10)}`,
        city: 'Yaounde',
        scheduledAt: scheduled.toISOString(),
        status,
        assignedTo: ['Agent A', 'Agent B', 'Agent C'][i % 3],
        notes: `[DEMO] clean booking ${String(i).padStart(4, '0')}`,
      }),
    );

    if (
      [
        CleanBookingStatus.CONFIRMED,
        CleanBookingStatus.ASSIGNED,
        CleanBookingStatus.IN_PROGRESS,
        CleanBookingStatus.DONE,
      ].includes(status)
    ) {
      const payment = await paymentRepo.save(
        paymentRepo.create({
          user,
          amount: Math.round(amount),
          currency: 'XAF',
          provider: pick(providers, i),
          status: PaymentStatus.SUCCESS,
          providerTransactionId: `DEMO-CLEAN-${String(i).padStart(6, '0')}`,
          referenceType: PaymentReferenceType.CLEAN_BOOKING,
          referenceId: booking.id,
        }),
      );
      booking.paymentId = payment.id;
      booking.paymentProvider = payment.provider;
      booking.paidAt = new Date().toISOString();
      await cleanBookingRepo.save(booking);
    }
    created++;
  }

  return created;
}

async function seedTodoOrders(
  todoOrderRepo: Repository<TodoOrder>,
  todoServiceRepo: Repository<TodoService>,
  paymentRepo: Repository<Payment>,
  user: User,
  count: number,
  reset: boolean,
): Promise<number> {
  if (reset) {
    await paymentRepo
      .createQueryBuilder()
      .delete()
      .where('referenceType = :type', { type: PaymentReferenceType.TODO_TASK })
      .execute();
    await todoOrderRepo
      .createQueryBuilder()
      .delete()
      .where('instructions LIKE :prefix', { prefix: '[DEMO]%' })
      .execute();
  }

  const services = await todoServiceRepo
    .createQueryBuilder('s')
    .where('s.title LIKE :prefix', { prefix: '[DEMO]%' })
    .take(Math.max(15, Math.min(120, count)))
    .getMany();
  if (services.length === 0) return 0;

  const statuses = Object.values(TodoOrderStatus);
  const providers = [PaymentProvider.WALLET, PaymentProvider.MTN_MOMO];
  let created = 0;

  for (let i = 1; i <= count; i++) {
    const service = pick(services, i);
    const status = pick(statuses, i);
    const amount = Number(service.basePrice);
    const order = await todoOrderRepo.save(
      todoOrderRepo.create({
        fullName: `[DEMO] Client Todo ${String(i).padStart(3, '0')}`,
        email: `demo.todo${String(i).padStart(3, '0')}@cempire.com`,
        phone: `+23766${String(1000000 + i).slice(-7)}`,
        todoServiceId: service.id,
        serviceTitle: service.title,
        instructions: `[DEMO] ordre todo ${String(i).padStart(4, '0')} - instructions detaillees`,
        address: `Douala, Zone Todo ${1 + (i % 9)}`,
        scheduledAt: new Date(Date.now() + (i % 20) * 86400000),
        amount,
        currency: 'XAF',
        status,
      }),
    );

    if (
      [
        TodoOrderStatus.CONFIRMED,
        TodoOrderStatus.IN_PROGRESS,
        TodoOrderStatus.COMPLETED,
      ].includes(status)
    ) {
      await paymentRepo.save(
        paymentRepo.create({
          user,
          amount: Math.round(amount),
          currency: 'XAF',
          provider: pick(providers, i),
          status: PaymentStatus.SUCCESS,
          providerTransactionId: `DEMO-TODO-${String(i).padStart(6, '0')}`,
          referenceType: PaymentReferenceType.TODO_TASK,
          referenceId: order.id,
        }),
      );
    }
    created++;
  }

  return created;
}

async function seedEventBookings(
  eventBookingRepo: Repository<EventBooking>,
  eventRepo: Repository<Event>,
  paymentRepo: Repository<Payment>,
  user: User,
  count: number,
  reset: boolean,
): Promise<number> {
  if (reset) {
    await paymentRepo
      .createQueryBuilder()
      .delete()
      .where('referenceType = :type', {
        type: PaymentReferenceType.EVENT_BOOKING,
      })
      .execute();
    await eventBookingRepo
      .createQueryBuilder()
      .delete()
      .where('location LIKE :prefix', { prefix: '[DEMO]%' })
      .execute();
  }

  const events = await eventRepo
    .createQueryBuilder('e')
    .where('e.title LIKE :prefix', { prefix: '[DEMO]%' })
    .take(Math.max(15, Math.min(100, count)))
    .getMany();
  if (events.length === 0) return 0;

  const statuses = Object.values(EventBookingStatus);
  const providers = [
    PaymentProvider.CARD,
    PaymentProvider.PAYPAL,
    PaymentProvider.WAVE,
  ];
  let created = 0;

  for (let i = 1; i <= count; i++) {
    const event = pick(events, i);
    const status = pick(statuses, i);
    const totalAmount = Number(event.basePrice);
    const booking = await eventBookingRepo.save(
      eventBookingRepo.create({
        user,
        event,
        eventDate: new Date(Date.now() + (i % 60) * 86400000),
        location: `[DEMO] Salle ${1 + (i % 14)} - Douala`,
        options: {
          guests: 20 + (i % 180),
          catering: i % 2 === 0,
          deco: i % 3 === 0,
        },
        totalAmount,
        status,
      }),
    );

    if (
      [EventBookingStatus.PAID, EventBookingStatus.VALIDATED].includes(status)
    ) {
      const payment = await paymentRepo.save(
        paymentRepo.create({
          user,
          amount: Math.round(totalAmount),
          currency: 'XAF',
          provider: pick(providers, i),
          status:
            status === EventBookingStatus.PAID
              ? PaymentStatus.SUCCESS
              : PaymentStatus.PENDING,
          providerTransactionId: `DEMO-EVENT-${String(i).padStart(6, '0')}`,
          referenceType: PaymentReferenceType.EVENT_BOOKING,
          referenceId: booking.id,
        }),
      );
      booking.payment = payment;
      await eventBookingRepo.save(booking);
    }
    created++;
  }

  return created;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const shopCount = intEnv('SEED_DEMO_SHOP_COUNT', 300);
  const grillCount = intEnv('SEED_DEMO_GRILL_COUNT', 300);
  const cleanCount = intEnv('SEED_DEMO_CLEAN_COUNT', 80);
  const todoCount = intEnv('SEED_DEMO_TODO_COUNT', 80);
  const eventsCount = intEnv('SEED_DEMO_EVENTS_COUNT', 80);
  const expressCouriers = intEnv('SEED_DEMO_EXPRESS_COURIERS', 40);
  const expressDeliveries = intEnv('SEED_DEMO_EXPRESS_DELIVERIES', 220);
  const shopOrdersCount = intEnv('SEED_DEMO_SHOP_ORDERS', 120);
  const grillOrdersCount = intEnv('SEED_DEMO_GRILL_ORDERS', 120);
  const cleanBookingsCount = intEnv('SEED_DEMO_CLEAN_BOOKINGS', 90);
  const todoOrdersCount = intEnv('SEED_DEMO_TODO_ORDERS', 90);
  const eventBookingsCount = intEnv('SEED_DEMO_EVENT_BOOKINGS', 70);
  const reset = boolEnv('SEED_DEMO_RESET', true);

  const sectorRepo = app.get<Repository<Sector>>(getRepositoryToken(Sector));
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const productRepo = app.get<Repository<Product>>(getRepositoryToken(Product));
  const grillRepo = app.get<Repository<GrillProduct>>(
    getRepositoryToken(GrillProduct),
  );
  const cleanRepo = app.get<Repository<CleanServiceEntity>>(
    getRepositoryToken(CleanServiceEntity),
  );
  const todoRepo = app.get<Repository<TodoService>>(
    getRepositoryToken(TodoService),
  );
  const eventRepo = app.get<Repository<Event>>(getRepositoryToken(Event));
  const courierRepo = app.get<Repository<CourierEntity>>(
    getRepositoryToken(CourierEntity),
  );
  const deliveryRepo = app.get<Repository<DeliveryEntity>>(
    getRepositoryToken(DeliveryEntity),
  );
  const shopOrderRepo = app.get<Repository<Order>>(getRepositoryToken(Order));
  const grillOrderRepo = app.get<Repository<GrillOrder>>(
    getRepositoryToken(GrillOrder),
  );
  const cleanBookingRepo = app.get<Repository<CleanBooking>>(
    getRepositoryToken(CleanBooking),
  );
  const todoOrderRepo = app.get<Repository<TodoOrder>>(
    getRepositoryToken(TodoOrder),
  );
  const eventBookingRepo = app.get<Repository<EventBooking>>(
    getRepositoryToken(EventBooking),
  );
  const paymentRepo = app.get<Repository<Payment>>(getRepositoryToken(Payment));

  console.log('Seeding demo data...');
  console.log({
    reset,
    shopCount,
    grillCount,
    cleanCount,
    todoCount,
    eventsCount,
    expressCouriers,
    expressDeliveries,
    shopOrdersCount,
    grillOrdersCount,
    cleanBookingsCount,
    todoOrdersCount,
    eventBookingsCount,
  });

  const shopSector = await ensureSector(
    sectorRepo,
    'Shop',
    'SHOP',
    'Boutique en ligne',
  );
  await ensureSector(
    sectorRepo,
    'Grill Food',
    'GRILL',
    'Service grill et fast-food',
  );
  await ensureSector(sectorRepo, 'Clean', 'CLEAN', 'Services de nettoyage');
  await ensureSector(sectorRepo, 'Todo', 'TODO', 'Services de conciergerie');
  await ensureSector(
    sectorRepo,
    'Events',
    'EVENTS',
    'Organisation d evenements',
  );
  await ensureSector(
    sectorRepo,
    'Express',
    'EXPRESS',
    'Livraison et logistique urbaine',
  );

  const demoUser = await ensureDemoUser(userRepo);

  const seededShop = await seedShopProducts(
    productRepo,
    shopSector.id,
    shopCount,
    reset,
  );
  const seededGrill = await seedGrillProducts(grillRepo, grillCount, reset);
  const seededClean = await seedCleanServices(cleanRepo, cleanCount, reset);
  const seededTodo = await seedTodoServices(todoRepo, todoCount, reset);
  const seededEvents = await seedEvents(eventRepo, eventsCount, reset);
  const seededExpress = await seedExpressOps(
    courierRepo,
    deliveryRepo,
    demoUser.id,
    expressCouriers,
    expressDeliveries,
    reset,
  );
  const seededShopOrders = await seedShopOrders(
    shopOrderRepo,
    productRepo,
    paymentRepo,
    demoUser,
    shopOrdersCount,
    reset,
  );
  const seededGrillOrders = await seedGrillOrders(
    grillOrderRepo,
    grillRepo,
    paymentRepo,
    demoUser,
    grillOrdersCount,
    reset,
  );
  const seededCleanBookings = await seedCleanBookings(
    cleanBookingRepo,
    cleanRepo,
    paymentRepo,
    demoUser,
    cleanBookingsCount,
    reset,
  );
  const seededTodoOrders = await seedTodoOrders(
    todoOrderRepo,
    todoRepo,
    paymentRepo,
    demoUser,
    todoOrdersCount,
    reset,
  );
  const seededEventBookings = await seedEventBookings(
    eventBookingRepo,
    eventRepo,
    paymentRepo,
    demoUser,
    eventBookingsCount,
    reset,
  );

  console.log('Seed completed.');
  console.table({
    shopProducts: seededShop,
    grillProducts: seededGrill,
    cleanServices: seededClean,
    todoServices: seededTodo,
    events: seededEvents,
    expressCouriers: seededExpress.couriers,
    expressDeliveries: seededExpress.deliveries,
    shopOrders: seededShopOrders,
    grillOrders: seededGrillOrders,
    cleanBookings: seededCleanBookings,
    todoOrders: seededTodoOrders,
    eventBookings: seededEventBookings,
  });

  await app.close();
}

void bootstrap();
