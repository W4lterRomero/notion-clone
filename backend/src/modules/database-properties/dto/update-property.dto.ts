import { IsString, IsObject, IsOptional, IsInt, Min } from 'class-validator';

export class UpdatePropertyDto {
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
}
