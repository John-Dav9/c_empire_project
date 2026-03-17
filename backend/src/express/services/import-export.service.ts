import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ImportExportEntity } from '../entities/import-export.entity';
import { CreateImportExportDto } from '../dto/create-import-export.dto';
import { ImportExportStatus } from '../enums/import-export-status.enum';

@Injectable()
export class ImportExportService {
  constructor(
    @InjectRepository(ImportExportEntity)
    private readonly importExportRepo: Repository<ImportExportEntity>,
  ) {}

  /**
   * USER - Créer une demande Import/Export
   */
  async create(
    userId: string,
    dto: CreateImportExportDto,
  ): Promise<ImportExportEntity> {
    const entity = this.importExportRepo.create({
      userId,
      originCountry: dto.originCountry,
      destinationCountry: dto.destinationCountry,
      description: dto.description,
      weightKg: dto.weightKg ?? 0,
      volumeM3: dto.volumeM3 ?? 0,
      customerNote: dto.customerNote,
      status: ImportExportStatus.REQUESTED,
    });

    return this.importExportRepo.save(entity);
  }

  /**
   * USER - Mes demandes
   */
  async findMy(userId: string): Promise<ImportExportEntity[]> {
    return this.importExportRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * USER - Détails sécurisé
   */
  async findOneForUserOrFail(
    userId: string,
    id: string,
  ): Promise<ImportExportEntity> {
    const entity = await this.importExportRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Import/Export request not found');

    if (entity.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return entity;
  }

  /**
   * ADMIN - Lister toutes les demandes (filtres optionnels)
   */
  async adminFindAll(params?: {
    status?: ImportExportStatus;
    userId?: string;
    originCountry?: string;
    destinationCountry?: string;
  }): Promise<ImportExportEntity[]> {
    const qb = this.importExportRepo
      .createQueryBuilder('ie')
      .orderBy('ie.createdAt', 'DESC');

    if (params?.status)
      qb.andWhere('ie.status = :status', { status: params.status });
    if (params?.userId)
      qb.andWhere('ie.userId = :userId', { userId: params.userId });

    if (params?.originCountry) {
      qb.andWhere('LOWER(ie.originCountry) = LOWER(:originCountry)', {
        originCountry: params.originCountry,
      });
    }

    if (params?.destinationCountry) {
      qb.andWhere('LOWER(ie.destinationCountry) = LOWER(:destinationCountry)', {
        destinationCountry: params.destinationCountry,
      });
    }

    return qb.getMany();
  }

  /**
   * ADMIN - Proposer un devis
   * Règle: possible uniquement si status REQUESTED (ou re-quote si tu veux)
   */
  async adminQuote(
    id: string,
    payload: { finalPrice: number; adminComment?: string },
  ) {
    const entity = await this.importExportRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Import/Export request not found');

    if (payload.finalPrice <= 0) {
      throw new BadRequestException('finalPrice must be > 0');
    }

    // Workflow simple: on quote à partir de REQUESTED
    if (entity.status !== ImportExportStatus.REQUESTED) {
      throw new BadRequestException(
        `Cannot quote when status is ${entity.status}`,
      );
    }

    entity.finalPrice = payload.finalPrice;
    entity.adminComment = payload.adminComment;
    entity.status = ImportExportStatus.QUOTED;

    return this.importExportRepo.save(entity);
  }

  /**
   * ADMIN - Mettre à jour le statut
   * Exemple transitions:
   * QUOTED -> IN_PROGRESS / REJECTED
   * IN_PROGRESS -> COMPLETED
   */
  async adminUpdateStatus(id: string, nextStatus: ImportExportStatus) {
    const entity = await this.importExportRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Import/Export request not found');

    if (entity.status === ImportExportStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot change status of a completed request',
      );
    }
    if (entity.status === ImportExportStatus.REJECTED) {
      throw new BadRequestException(
        'Cannot change status of a rejected request',
      );
    }

    // Petite règle: on ne peut pas mettre IN_PROGRESS sans devis final
    if (nextStatus === ImportExportStatus.IN_PROGRESS && !entity.finalPrice) {
      throw new BadRequestException('Cannot start without a quoted finalPrice');
    }

    entity.status = nextStatus;
    return this.importExportRepo.save(entity);
  }

  /**
   * USER - Accepter un devis (QUOTED -> ACCEPTED)
   */
  async userAcceptQuote(userId: string, id: string) {
    const entity = await this.findOneForUserOrFail(userId, id);

    if (entity.status !== ImportExportStatus.QUOTED) {
      throw new BadRequestException('No quote to accept for this request');
    }

    entity.status = ImportExportStatus.ACCEPTED;
    return this.importExportRepo.save(entity);
  }
}
