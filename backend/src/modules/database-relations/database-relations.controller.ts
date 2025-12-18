import {
    Controller,
    Patch,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DatabaseRelationsService } from './database-relations.service';
import { UpdateRelationsDto } from './dto/update-relations.dto';

@Controller('databases/:databaseId/rows/:rowId/relations')
@UseGuards(JwtAuthGuard)
export class DatabaseRelationsController {
    constructor(
        private readonly relationsService: DatabaseRelationsService,
    ) { }

    @Patch()
    async updateRelations(
        @Param('databaseId') databaseId: string,
        @Param('rowId') rowId: string,
        @Body() updateRelationsDto: UpdateRelationsDto,
        @Request() req: { user: { userId: string } },
    ) {
        const relations = await this.relationsService.setRelations(
            rowId,
            updateRelationsDto.propertyId,
            updateRelationsDto.targetRowIds,
        );

        return {
            success: true,
            relations: relations.map((r) => ({
                id: r.id,
                targetRowId: r.targetRowId,
            })),
        };
    }
}
