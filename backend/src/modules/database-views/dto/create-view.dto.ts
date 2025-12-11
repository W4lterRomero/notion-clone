import { IsString, IsEnum, IsObject, IsOptional, IsNotEmpty, IsInt, Min, IsBoolean } from 'class-validator';
import { ViewType } from '../entities/database-view.entity';

export class CreateViewDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsEnum(ViewType)
    @IsNotEmpty()
    type!: ViewType;

    @IsObject()
    @IsOptional()
    config?: object;

    @IsInt()
    @Min(0)
    @IsOptional()
    position?: number;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}
