import { IsString, IsObject, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

export class UpdateViewDto {
    @IsString()
    @IsOptional()
    name?: string;

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
