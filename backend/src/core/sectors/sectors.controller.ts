import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SectorsService } from './sectors.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';
import { Permissions } from 'src/core/permissions/permissions.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

type UploadedFileShape = {
  filename: string;
};

@Controller('sectors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class SectorsController {
  constructor(private readonly sectorsService: SectorsService) {}

  private ensureSectorsUploadDir(): string {
    const uploadDir = join(process.cwd(), 'uploads', 'sectors');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  @Post('upload-images')
  @HttpCode(HttpStatus.OK)
  @Permissions('sectors:manage')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = join(process.cwd(), 'uploads', 'sectors');
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = /image\/(jpeg|jpg|png|webp|gif)/.test(file.mimetype);
        cb(
          allowed ? null : new BadRequestException('Fichier image invalide.'),
          allowed,
        );
      },
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  uploadImages(@UploadedFiles() files: UploadedFileShape[]) {
    this.ensureSectorsUploadDir();
    const uploaded = (files ?? []).map(
      (file) => `/uploads/sectors/${file.filename}`,
    );
    return { files: uploaded };
  }

  @Post()
  @Permissions('sectors:manage')
  create(@Body() dto: CreateSectorDto) {
    return this.sectorsService.create(dto);
  }

  @Get()
  @Permissions('sectors:read')
  findAll() {
    return this.sectorsService.findAll();
  }

  @Get(':id')
  @Permissions('sectors:read')
  findOne(@Param('id') id: string) {
    return this.sectorsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('sectors:manage')
  update(@Param('id') id: string, @Body() dto: UpdateSectorDto) {
    return this.sectorsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('sectors:manage')
  remove(@Param('id') id: string) {
    return this.sectorsService.remove(id);
  }
}
