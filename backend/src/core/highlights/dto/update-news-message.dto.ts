import { PartialType } from '@nestjs/mapped-types';
import { CreateNewsMessageDto } from './create-news-message.dto';

export class UpdateNewsMessageDto extends PartialType(CreateNewsMessageDto) {}
