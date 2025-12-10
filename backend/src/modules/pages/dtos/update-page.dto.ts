import { PartialType } from '@nestjs/mapped-types';
import { CreatePageDto } from './create-page.dto';
import { OmitType } from '@nestjs/mapped-types';

export class UpdatePageDto extends PartialType(
    OmitType(CreatePageDto, ['workspaceId'] as const)
) { }
