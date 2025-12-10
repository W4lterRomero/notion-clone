import { IsArray, ValidateNested, IsUUID, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class BlockPosition {
    @IsUUID()
    id!: string;

    @IsInt()
    position!: number;
}

export class ReorderBlocksDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BlockPosition)
    blocks!: BlockPosition[];
}
