import { IsInt, IsOptional, IsUrl, Max, Min } from 'class-validator';

export class CreateUrlDto {
  @IsUrl({}, { message: 'originalUrl must be a valid URL' })
  originalUrl: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  expiresInHours?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxClicks?: number;
}
