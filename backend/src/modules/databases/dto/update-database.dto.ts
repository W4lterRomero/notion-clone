import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateDatabaseDto {
    @IsString()
    @IsOptional()
    @MaxLength(255)
    title?: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    cover?: string;
}
