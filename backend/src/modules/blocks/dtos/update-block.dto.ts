import { IsEnum, IsString, IsInt, IsOptional, IsObject } from 'class-validator';
import { BlockType } from '../entities/block.entity';

export class UpdateBlockDto {
    @IsEnum(BlockType)
    @IsOptional()
    type?: BlockType;

    @IsString()
    @IsOptional()
    content?: string;

    @IsObject()
    @IsOptional()
    properties?: Record<string, any>;

    @IsInt()
    @IsOptional()
    position?: number;
}
