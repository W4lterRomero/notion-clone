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
import { DatabaseViewsService } from './database-views.service';
import { CreateViewDto } from './dto/create-view.dto';
import { UpdateViewDto } from './dto/update-view.dto';

@Controller('databases/:databaseId/views')
export class DatabaseViewsController {
    constructor(private readonly databaseViewsService: DatabaseViewsService) { }

    @Post()
    create(
        @Param('databaseId') databaseId: string,
        @Body() createViewDto: CreateViewDto,
        @Request() req: any,
    ) {
        return this.databaseViewsService.create(
            databaseId,
            createViewDto,
            req.user.userId,
        );
    }

    @Get()
    findAll(@Param('databaseId') databaseId: string, @Request() req: any) {
        return this.databaseViewsService.findAll(databaseId, req.user.userId);
    }

    @Patch(':viewId')
    update(
        @Param('databaseId') databaseId: string,
        @Param('viewId') viewId: string,
        @Body() updateViewDto: UpdateViewDto,
        @Request() req: any,
    ) {
        return this.databaseViewsService.update(
            databaseId,
            viewId,
            updateViewDto,
            req.user.userId,
        );
    }

    @Delete(':viewId')
    remove(
        @Param('databaseId') databaseId: string,
        @Param('viewId') viewId: string,
        @Request() req: any,
    ) {
        return this.databaseViewsService.remove(
            databaseId,
            viewId,
            req.user.userId,
        );
    }
}
