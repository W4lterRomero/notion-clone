import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
} from '@nestjs/common';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dtos/create-page.dto';
import { UpdatePageDto } from './dtos/update-page.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('pages')
export class PagesController {
    constructor(private readonly pagesService: PagesService) { }

    @Post()
    create(@Body() createPageDto: CreatePageDto, @CurrentUser() user: User) {
        return this.pagesService.create(createPageDto, user);
    }

    @Get()
    findAll(
        @Query('workspaceId') workspaceId: string,
        @CurrentUser() user: User,
    ) {
        return this.pagesService.findAll(workspaceId, user);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: User) {
        return this.pagesService.findOne(id, user);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updatePageDto: UpdatePageDto,
        @CurrentUser() user: User,
    ) {
        return this.pagesService.update(id, updatePageDto, user);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: User) {
        return this.pagesService.remove(id, user);
    }
}
