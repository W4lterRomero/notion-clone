import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Patch,
    Body,
    Param,
} from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateBlockDto } from './dtos/create-block.dto';
import { UpdateBlockDto } from './dtos/update-block.dto';
import { ReorderBlocksDto } from './dtos/reorder-blocks.dto';

@Controller('blocks')
export class BlocksController {
    constructor(private readonly blocksService: BlocksService) { }

    @Post()
    create(@Body() createBlockDto: CreateBlockDto, @CurrentUser() user: User) {
        return this.blocksService.create(createBlockDto, user);
    }

    @Get('page/:pageId')
    findByPage(@Param('pageId') pageId: string, @CurrentUser() user: User) {
        return this.blocksService.findByPage(pageId, user);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Body() updateBlockDto: UpdateBlockDto,
        @CurrentUser() user: User,
    ) {
        return this.blocksService.update(id, updateBlockDto, user);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: User) {
        return this.blocksService.remove(id, user);
    }

    @Patch('reorder')
    reorder(
        @Body() reorderBlocksDto: ReorderBlocksDto,
        @CurrentUser() user: User,
    ) {
        return this.blocksService.reorder(reorderBlocksDto, user);
    }
}
