import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from './entities/page.entity';
import { CreatePageDto } from './dtos/create-page.dto';
import { UpdatePageDto } from './dtos/update-page.dto';
import { User } from '../users/entities/user.entity';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class PagesService {
    constructor(
        @InjectRepository(Page)
        private pagesRepository: Repository<Page>,
        private workspacesService: WorkspacesService,
    ) { }

    async create(createPageDto: CreatePageDto, user: User) {
        // Verify workspace access
        await this.workspacesService.findOne(createPageDto.workspaceId, user);

        const page = this.pagesRepository.create({
            ...createPageDto,
            workspaceId: createPageDto.workspaceId,
        });

        // Logic for parentId if needed (verify parent belongs to same workspace)
        if (createPageDto.parentId) {
            const parent = await this.pagesRepository.findOne({ where: { id: createPageDto.parentId } });
            if (!parent || parent.workspaceId !== createPageDto.workspaceId) {
                throw new NotFoundException('Parent page not found in this workspace');
            }
            page.parent = parent;
        }

        return this.pagesRepository.save(page);
    }

    async findAll(workspaceId: string, user: User) {
        // Verify access
        await this.workspacesService.findOne(workspaceId, user);

        return this.pagesRepository.find({
            where: { workspaceId },
            order: { createdAt: 'DESC' },
            relations: ['children'], // Ideally we use a recursive query or tree repository, but this is simple for starters
        });
    }

    async findOne(id: string, user: User) {
        const page = await this.pagesRepository.findOne({
            where: { id },
            relations: ['workspace', 'children', 'parent'],
        });

        if (!page) {
            throw new NotFoundException('Page not found');
        }

        // Verify access to workspace
        await this.workspacesService.findOne(page.workspaceId, user);

        return page;
    }

    async update(id: string, updatePageDto: UpdatePageDto, user: User) {
        const page = await this.findOne(id, user);
        Object.assign(page, updatePageDto);
        return this.pagesRepository.save(page);
    }

    async remove(id: string, user: User) {
        const page = await this.findOne(id, user);
        return this.pagesRepository.remove(page);
    }
}
