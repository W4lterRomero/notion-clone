import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateRowDto {
    @IsString()
    @IsOptional()
    @MaxLength(255)
    title?: string;

    @IsString()
    @IsOptional()
    icon?: string;
}
