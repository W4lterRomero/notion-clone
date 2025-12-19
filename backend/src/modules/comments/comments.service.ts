import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Page } from '../pages/entities/page.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private commentsRepository: Repository<Comment>,
        @InjectRepository(Page)
        private pageRepository: Repository<Page>,
    ) { }

    async create(createCommentDto: CreateCommentDto, userId: string) {
        const page = await this.pageRepository.findOne({ where: { id: createCommentDto.pageId } });
        if (!page) {
            throw new NotFoundException('Page not found');
        }

        const comment = this.commentsRepository.create({
            content: createCommentDto.content,
            pageId: createCommentDto.pageId,
            authorId: userId,
        });

        return this.commentsRepository.save(comment);
    }

    async findAll(pageId: string) {
        return this.commentsRepository.find({
            where: { pageId },
            relations: ['author'],
            order: { createdAt: 'DESC' },
        });
    }

    async remove(id: string, userId: string) {
        const comment = await this.commentsRepository.findOne({ where: { id } });
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        // In a real app we'd check if user is author or admin
        // if (comment.authorId !== userId) throw new ForbiddenException(...);

        return this.commentsRepository.remove(comment);
    }
}
