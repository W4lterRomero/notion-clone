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
import { DatabasesService } from './databases.service';
import { CreateDatabaseDto } from './dto/create-database.dto';
import { UpdateDatabaseDto } from './dto/update-database.dto';

@Controller('databases')
export class DatabasesController {
    constructor(private readonly databasesService: DatabasesService) { }

    @Post()
    create(@Body() createDatabaseDto: CreateDatabaseDto, @Request() req: any) {
        return this.databasesService.create(createDatabaseDto, req.user.userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.databasesService.findOne(id, req.user.userId);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateDatabaseDto: UpdateDatabaseDto,
        @Request() req: any,
    ) {
        return this.databasesService.update(id, updateDatabaseDto, req.user.userId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.databasesService.remove(id, req.user.userId);
    }
}
