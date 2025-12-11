import { IsString, IsEnum, IsObject, IsOptional, IsNotEmpty, IsInt, Min } from 'class-validator';
import { PropertyType } from '../entities/database-property.entity';

export class CreatePropertyDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsEnum(PropertyType)
    @IsNotEmpty()
    type!: PropertyType;

    @IsObject()
    @IsOptional()
    config?: object;

    @IsInt()
    @Min(0)
    @IsOptional()
    position?: number;
}
