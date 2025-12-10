import { IsEnum, IsString, IsInt, IsUUID, IsOptional, IsObject } from 'class-validator';
import { BlockType } from '../entities/block.entity';

export class CreateBlockDto {
    @IsEnum(BlockType)
    type!: BlockType;

    @IsString()
    @IsOptional()
    content?: string;

    @IsObject()
    @IsOptional()
    properties?: Record<string, any>;

    @IsInt()
    position!: number;

    @IsUUID()
    pageId!: string;

    @IsUUID()
    @IsOptional()
    parentId?: string;
}
