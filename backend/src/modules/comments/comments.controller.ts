import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Post()
    create(@Body() createCommentDto: CreateCommentDto, @Request() req: any) {
        return this.commentsService.create(createCommentDto, req.user.id);
    }

    @Get()
    findAll(@Query('pageId') pageId: string) {
        return this.commentsService.findAll(pageId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.commentsService.remove(id, req.user.id);
    }
}
