import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Block } from './entities/block.entity';
import { Page } from '../pages/entities/page.entity';
import { CreateBlockDto } from './dtos/create-block.dto';
import { UpdateBlockDto } from './dtos/update-block.dto';
import { ReorderBlocksDto } from './dtos/reorder-blocks.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class BlocksService {
    constructor(
        @InjectRepository(Block)
        private readonly blockRepository: Repository<Block>,
        @InjectRepository(Page)
        private readonly pageRepository: Repository<Page>,
    ) { }

    async create(createBlockDto: CreateBlockDto, user: User): Promise<Block> {
        const page = await this.pageRepository.findOne({
            where: { id: createBlockDto.pageId },
            relations: ['workspace'],
        });

        if (!page) {
            throw new NotFoundException('Page not found');
        }

        if (page.workspace.ownerId !== user.id) {
            throw new ForbiddenException('You do not have access to this page');
        }

        const block = this.blockRepository.create(createBlockDto);
        return await this.blockRepository.save(block);
    }

    async findByPage(pageId: string, user: User): Promise<Block[]> {
        const page = await this.pageRepository.findOne({
            where: { id: pageId },
            relations: ['workspace'],
        });

        if (!page) {
            throw new NotFoundException('Page not found');
        }

        if (page.workspace.ownerId !== user.id && !page.isPublic) {
            throw new ForbiddenException('You do not have access to this page');
        }

        return await this.blockRepository.find({
            where: { pageId },
            order: { position: 'ASC' },
        });
    }

    async update(
        id: string,
        updateBlockDto: UpdateBlockDto,
        user: User,
    ): Promise<Block> {
        const block = await this.blockRepository.findOne({
            where: { id },
            relations: ['page', 'page.workspace'],
        });

        if (!block) {
            throw new NotFoundException('Block not found');
        }

        if (block.page.workspace.ownerId !== user.id) {
            throw new ForbiddenException('You do not have access to this block');
        }

        Object.assign(block, updateBlockDto);
        return await this.blockRepository.save(block);
    }

    async remove(id: string, user: User): Promise<void> {
        const block = await this.blockRepository.findOne({
            where: { id },
            relations: ['page', 'page.workspace'],
        });

        if (!block) {
            throw new NotFoundException('Block not found');
        }

        if (block.page.workspace.ownerId !== user.id) {
            throw new ForbiddenException('You do not have access to this block');
        }

        await this.blockRepository.remove(block);
    }

    async reorder(
        reorderBlocksDto: ReorderBlocksDto,
        user: User,
    ): Promise<Block[]> {
        const blockIds = reorderBlocksDto.blocks.map((b) => b.id);
        const blocks = await this.blockRepository.find({
            where: { id: In(blockIds) },
            relations: ['page', 'page.workspace'],
        });

        if (blocks.length !== blockIds.length) {
            throw new NotFoundException('Some blocks not found');
        }

        const hasAccess = blocks.every(
            (block) => block.page.workspace.ownerId === user.id,
        );

        if (!hasAccess) {
            throw new ForbiddenException('You do not have access to these blocks');
        }

        for (const { id, position } of reorderBlocksDto.blocks) {
            await this.blockRepository.update(id, { position });
        }

        return await this.blockRepository.find({
            where: { id: In(blockIds) },
            order: { position: 'ASC' },
        });
    }
}
