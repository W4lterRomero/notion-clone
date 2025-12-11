import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseView } from './entities/database-view.entity';
import { Page, PageType } from '../pages/entities/page.entity';
import { CreateViewDto } from './dto/create-view.dto';
import { UpdateViewDto } from './dto/update-view.dto';

@Injectable()
export class DatabaseViewsService {
    constructor(
        @InjectRepository(DatabaseView)
        private viewRepository: Repository<DatabaseView>,
        @InjectRepository(Page)
        private pageRepository: Repository<Page>,
    ) { }

    async create(databaseId: string, createViewDto: CreateViewDto, userId: string) {
        // Verify database exists
        const database = await this.pageRepository.findOne({
            where: { id: databaseId, type: PageType.DATABASE },
        });

        if (!database) {
            throw new NotFoundException('Database not found');
        }

        // Auto-assign position if not provided
        if (createViewDto.position === undefined) {
            const lastView = await this.viewRepository.findOne({
                where: { databaseId },
                order: { position: 'DESC' },
            });

            createViewDto.position = lastView ? lastView.position + 1 : 0;
        }

        // If this is marked as default, unset other defaults
        if (createViewDto.isDefault) {
            await this.viewRepository.update(
                { databaseId, isDefault: true },
                { isDefault: false },
            );
        }

        const view = this.viewRepository.create({
            databaseId,
            ...createViewDto,
        });

        return this.viewRepository.save(view);
    }

    async findAll(databaseId: string, userId: string) {
        return this.viewRepository.find({
            where: { databaseId },
            order: { position: 'ASC' },
        });
    }

    async update(
        databaseId: string,
        viewId: string,
        updateViewDto: UpdateViewDto,
        userId: string,
    ) {
        const view = await this.viewRepository.findOne({
            where: { id: viewId, databaseId },
        });

        if (!view) {
            throw new NotFoundException('View not found');
        }

        // If setting as default, unset other defaults
        if (updateViewDto.isDefault) {
            await this.viewRepository.update(
                { databaseId, isDefault: true },
                { isDefault: false },
            );
        }

        Object.assign(view, updateViewDto);

        return this.viewRepository.save(view);
    }

    async remove(databaseId: string, viewId: string, userId: string) {
        const view = await this.viewRepository.findOne({
            where: { id: viewId, databaseId },
        });

        if (!view) {
            throw new NotFoundException('View not found');
        }

        // Don't allow deleting the only view
        const viewCount = await this.viewRepository.count({
            where: { databaseId },
        });

        if (viewCount <= 1) {
            throw new NotFoundException('Cannot delete the only view');
        }

        // If deleting the default view, make another one default
        if (view.isDefault) {
            const anotherView = await this.viewRepository.findOne({
                where: { databaseId },
                order: { position: 'ASC' },
            });

            if (anotherView && anotherView.id !== viewId) {
                anotherView.isDefault = true;
                await this.viewRepository.save(anotherView);
            }
        }

        await this.viewRepository.remove(view);

        return { message: 'View deleted successfully' };
    }
}
