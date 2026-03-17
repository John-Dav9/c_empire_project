import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/reate-product.dto';

import { UseGuards } from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { Permissions } from 'src/core/permissions/permissions.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { Public } from 'src/auth/decorators/public.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

type UploadedFileShape = {
  filename: string;
  originalname: string;
  mimetype: string;
};

@Controller('cshop/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('shop:products:update')
  @Post('upload-images')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = join(process.cwd(), 'uploads', 'products');
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
    const uploaded = (files ?? []).map(
      (file) => `/uploads/products/${file.filename}`,
    );
    return { files: uploaded };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('shop:products:update')
  @Post('upload-technical-sheet')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor('files', 1, {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = join(process.cwd(), 'uploads', 'products');
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
        const isPdf =
          file.mimetype === 'application/pdf' ||
          file.originalname.toLowerCase().endsWith('.pdf');
        cb(
          isPdf
            ? null
            : new BadRequestException('Seul un fichier PDF est accepté.'),
          isPdf,
        );
      },
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  uploadTechnicalSheet(@UploadedFiles() files: UploadedFileShape[]) {
    const pdfFile = files?.[0];
    if (!pdfFile) {
      throw new BadRequestException('Aucun fichier PDF reçu.');
    }
    return { file: `/uploads/products/${pdfFile.filename}` };
  }

  // ➕ Créer un produit (ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('shop:products:create')
  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  // 📄 Liste produits (+ pagination + recherche)
  @Public()
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.productService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      isActive: typeof isActive === 'string' ? isActive === 'true' : undefined,
    });
  }

  // 🔎 Détail produit
  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Product> {
    return this.productService.findOne(id);
  }

  // ✏️ Update produit
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('shop:products:update')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  // 🗑️ Delete produit
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('shop:products:delete')
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ deleted: boolean }> {
    await this.productService.remove(id);
    return { deleted: true };
  }
}
