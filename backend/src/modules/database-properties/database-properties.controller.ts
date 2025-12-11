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
import { DatabasePropertiesService } from './database-properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Controller('databases/:databaseId/properties')
export class DatabasePropertiesController {
    constructor(
        private readonly databasePropertiesService: DatabasePropertiesService,
    ) { }

    @Post()
    create(
        @Param('databaseId') databaseId: string,
        @Body() createPropertyDto: CreatePropertyDto,
        @Request() req: any,
    ) {
        return this.databasePropertiesService.create(
            databaseId,
            createPropertyDto,
            req.user.userId,
        );
    }

    @Get()
    findAll(@Param('databaseId') databaseId: string, @Request() req: any) {
        return this.databasePropertiesService.findAll(databaseId, req.user.userId);
    }

    @Patch(':propertyId')
    update(
        @Param('databaseId') databaseId: string,
        @Param('propertyId') propertyId: string,
        @Body() updatePropertyDto: UpdatePropertyDto,
        @Request() req: any,
    ) {
        return this.databasePropertiesService.update(
            databaseId,
            propertyId,
            updatePropertyDto,
            req.user.userId,
        );
    }

    @Delete(':propertyId')
    remove(
        @Param('databaseId') databaseId: string,
        @Param('propertyId') propertyId: string,
        @Request() req: any,
    ) {
        return this.databasePropertiesService.remove(
            databaseId,
            propertyId,
            req.user.userId,
        );
    }
}
