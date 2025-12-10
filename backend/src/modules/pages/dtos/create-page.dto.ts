import { IsNotEmpty, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class CreatePageDto {
    @IsNotEmpty()
    @IsString()
    title!: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsString()
    cover?: string;

    @IsNotEmpty()
    @IsUUID()
    workspaceId!: string;

    @IsOptional()
    @IsUUID()
    parentId?: string;

    @IsOptional()
    @IsBoolean()
    isPublic?: boolean;
}
