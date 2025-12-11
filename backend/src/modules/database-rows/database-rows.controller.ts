import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Request,
} from '@nestjs/common';
import { DatabaseRowsService } from './database-rows.service';
import { CreateRowDto } from './dto/create-row.dto';
import { UpdateRowValueDto } from './dto/update-row-value.dto';

@Controller('databases/:databaseId/rows')
export class DatabaseRowsController {
    constructor(private readonly databaseRowsService: DatabaseRowsService) { }

    @Post()
    create(
        @Param('databaseId') databaseId: string,
        @Body() createRowDto: CreateRowDto,
        @Request() req: any,
    ) {
        return this.databaseRowsService.create(
            databaseId,
            createRowDto,
            req.user.userId,
        );
    }

    @Get()
    findAll(@Param('databaseId') databaseId: string, @Request() req: any) {
        return this.databaseRowsService.findAll(databaseId, req.user.userId);
    }

    @Get(':rowId')
    findOne(
        @Param('databaseId') databaseId: string,
        @Param('rowId') rowId: string,
        @Request() req: any,
    ) {
        return this.databaseRowsService.findOne(databaseId, rowId, req.user.userId);
    }

    @Patch(':rowId/values')
    updateValue(
        @Param('databaseId') databaseId: string,
        @Param('rowId') rowId: string,
        @Body() updateRowValueDto: UpdateRowValueDto,
        @Request() req: any,
    ) {
        return this.databaseRowsService.updateValue(
            databaseId,
            rowId,
            updateRowValueDto,
            req.user.userId,
        );
    }

    @Delete(':rowId')
    remove(
        @Param('databaseId') databaseId: string,
        @Param('rowId') rowId: string,
        @Request() req: any,
    ) {
        return this.databaseRowsService.remove(databaseId, rowId, req.user.userId);
    }
}
