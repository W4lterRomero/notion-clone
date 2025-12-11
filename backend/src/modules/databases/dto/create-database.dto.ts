import { IsString, IsUUID, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateDatabaseDto {
    @IsUUID()
    @IsNotEmpty()
    workspaceId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title!: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    cover?: string;
}
