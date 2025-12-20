import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page, PageType } from '../pages/entities/page.entity';
import { CreateDatabaseDto } from './dto/create-database.dto';
import { UpdateDatabaseDto } from './dto/update-database.dto';
import { DatabaseProperty, PropertyType } from '../database-properties/entities/database-property.entity';
import { DatabaseView, ViewType, TableViewConfig } from '../database-views/entities/database-view.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';

@Injectable()
export class DatabasesService {
    constructor(
        @InjectRepository(Page)
        private pageRepository: Repository<Page>,
        @InjectRepository(DatabaseProperty)
        private propertyRepository: Repository<DatabaseProperty>,
        @InjectRepository(DatabaseView)
        private viewRepository: Repository<DatabaseView>,
    ) { }

    async create(createDatabaseDto: CreateDatabaseDto, userId: string) {
        // Verify workspace access
        const workspaceExists = await this.pageRepository.manager
            .getRepository(Workspace)
            .findOne({ where: { id: createDatabaseDto.workspaceId } });

        if (!workspaceExists) {
            throw new NotFoundException('Workspace not found');
        }

        // Create the page as a database
        const database = this.pageRepository.create({
            ...createDatabaseDto,
            type: PageType.DATABASE,
            parentId: createDatabaseDto.parentId,
        });

        const savedDatabase = await this.pageRepository.save(database);

        // Create default "Name" property (title)
        const titleProperty = this.propertyRepository.create({
            databaseId: savedDatabase.id,
            name: 'Name',
            type: PropertyType.TITLE,
            config: {},
            position: 0,
        });

        await this.propertyRepository.save(titleProperty);

        // Create default "Table" view
        const tableView = this.viewRepository.create({
            databaseId: savedDatabase.id,
            name: 'Table',
            type: ViewType.TABLE,
            config: {
                visibleProperties: [titleProperty.id],
                propertyWidths: {},
                sorts: [],
            },
            position: 0,
            isDefault: true,
        });

        await this.viewRepository.save(tableView);

        // [PREMIUM FIX] Add "Tags" property (Select)
        const tagsProperty = this.propertyRepository.create({
            databaseId: savedDatabase.id,
            name: 'Tags',
            type: PropertyType.SELECT,
            config: {
                options: [
                    { id: 'opt_1', name: 'Work', color: 'blue' },
                    { id: 'opt_2', name: 'Personal', color: 'green' },
                    { id: 'opt_3', name: 'Urgent', color: 'red' },
                ]
            },
            position: 1,
        });
        await this.propertyRepository.save(tagsProperty);

        // [PREMIUM FIX] Add "Status" property (Status)
        const statusProperty = this.propertyRepository.create({
            databaseId: savedDatabase.id,
            name: 'Status',
            type: PropertyType.STATUS,
            config: {
                options: [
                    { id: 'stat_1', name: 'Not Started', color: 'gray' },
                    { id: 'stat_2', name: 'In Progress', color: 'blue' },
                    { id: 'stat_3', name: 'Done', color: 'green' },
                ]
            },
            position: 2,
        });
        await this.propertyRepository.save(statusProperty);

        // Update view to show new properties
        (tableView.config as TableViewConfig).visibleProperties = [
            titleProperty.id,
            tagsProperty.id,
            statusProperty.id
        ];
        await this.viewRepository.save(tableView);

        // [PREMIUM FIX] Create 3 Empty Rows
        const rowsToCreate = 3;
        for (let i = 0; i < rowsToCreate; i++) {
            const row = this.pageRepository.create({
                type: PageType.PAGE,
                parentDatabaseId: savedDatabase.id,
                workspaceId: createDatabaseDto.workspaceId,
                title: '',
                // Remove explicit nulls to avoid type issues
            });
            await this.pageRepository.save(row);
        }

        return this.findOne(savedDatabase.id, userId);
    }

    async findOne(id: string, userId: string) {
        const database = await this.pageRepository.findOne({
            where: { id, type: PageType.DATABASE },
        });

        if (!database) {
            throw new NotFoundException('Database not found');
        }

        // Get properties ordered by position
        const properties = await this.propertyRepository.find({
            where: { databaseId: id },
            order: { position: 'ASC' },
        });

        // Get views ordered by position
        const views = await this.viewRepository.find({
            where: { databaseId: id },
            order: { position: 'ASC' },
        });

        // Get row count
        const rowCount = await this.pageRepository.count({
            where: { parentDatabaseId: id },
        });

        return {
            ...database,
            properties,
            views,
            rowCount,
        };
    }

    async update(id: string, updateDatabaseDto: UpdateDatabaseDto, userId: string) {
        const database = await this.pageRepository.findOne({
            where: { id, type: PageType.DATABASE },
        });

        if (!database) {
            throw new NotFoundException('Database not found');
        }

        Object.assign(database, updateDatabaseDto);

        return this.pageRepository.save(database);
    }

    async remove(id: string, userId: string) {
        const database = await this.pageRepository.findOne({
            where: { id, type: PageType.DATABASE },
        });

        if (!database) {
            throw new NotFoundException('Database not found');
        }

        await this.pageRepository.remove(database);

        return { message: 'Database deleted successfully' };
    }
}
