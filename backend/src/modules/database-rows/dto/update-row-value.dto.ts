import { IsUUID, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateRowValueDto {
    @IsUUID()
    @IsNotEmpty()
    propertyId!: string;

    @IsOptional()
    value: any; // Can be string, number, boolean, array, object, etc.
}
