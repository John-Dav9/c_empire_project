import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './reate-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
