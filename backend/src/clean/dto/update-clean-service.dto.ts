import { PartialType } from '@nestjs/mapped-types';
import { CreateCleanServiceDto } from './create-clean-service.dto';

export class UpdateCleanServiceDto extends PartialType(CreateCleanServiceDto) {}
