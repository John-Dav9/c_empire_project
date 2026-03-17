import { IsEnum } from 'class-validator';
import { CleanReviewStatus } from '../enums/clean-review-status.enum';

export class UpdateCleanReviewStatusDto {
  @IsEnum(CleanReviewStatus)
  status: CleanReviewStatus;
}
