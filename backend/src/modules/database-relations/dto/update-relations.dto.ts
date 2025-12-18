import { IsString, IsArray, IsUUID } from 'class-validator';

export class UpdateRelationsDto {
    @IsUUID()
    @IsString()
    propertyId!: string;

    @IsArray()
    @IsUUID('4', { each: true })
    targetRowIds!: string[];
}
