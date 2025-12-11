import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page, PageType } from '../pages/entities/page.entity';
import { DatabasePropertyValue } from '../database-property-values/entities/database-property-value.entity';
import { DatabaseProperty, PropertyType } from '../database-properties/entities/database-property.entity';
import { CreateRowDto } from './dto/create-row.dto';
import { UpdateRowValueDto } from './dto/update-row-value.dto';

@Injectable()
export class DatabaseRowsService {
    constructor(
        @InjectRepository(Page)
        private pageRepository: Repository<Page>,
        @InjectRepository(DatabasePropertyValue)
        private propertyValueRepository: Repository<DatabasePropertyValue>,
        @InjectRepository(DatabaseProperty)
        private propertyRepository: Repository<DatabaseProperty>,
    ) { }

    async create(databaseId: string, createRowDto: CreateRowDto, userId: string) {
        // Verify database exists
        const database = await this.pageRepository.findOne({
            where: { id: databaseId, type: PageType.DATABASE },
        });

        if (!database) {
            throw new NotFoundException('Database not found');
        }

        // Create row as a page with parentDatabaseId
        const row = this.pageRepository.create({
            title: createRowDto.title || 'Untitled',
            icon: createRowDto.icon,
            type: PageType.PAGE,
            parentDatabaseId: databaseId,
            workspaceId: database.workspaceId,
        });

        const savedRow = await this.pageRepository.save(row);

        // If title was provided, also save it as the title property value
        if (createRowDto.title) {
            const titleProperty = await this.propertyRepository.findOne({
                where: { databaseId, type: PropertyType.TITLE },
            });

            if (titleProperty) {
                const titleValue = this.propertyValueRepository.create({
                    rowId: savedRow.id,
                    propertyId: titleProperty.id,
                    value: createRowDto.title,
                });
                await this.propertyValueRepository.save(titleValue);
            }
        }

        return savedRow;
    }

    async findAll(databaseId: string, userId: string) {
        // Get all rows for the database
        const rows = await this.pageRepository.find({
            where: { parentDatabaseId: databaseId },
            order: { createdAt: 'ASC' },
        });

        if (rows.length === 0) {
            return [];
        }

        // Get all property values for these rows
        const rowIds = rows.map((r) => r.id);

        const values = await this.propertyValueRepository.find({
            where: rowIds.map(id => ({ rowId: id })),
        });

        // Get all properties for this database (to include property info)
        const properties = await this.propertyRepository.find({
            where: { databaseId },
        });

        const propertiesMap = new Map(properties.map(p => [p.id, p]));

        // Group values by row
        const valuesByRow = new Map<string, any[]>();
        for (const value of values) {
            if (!valuesByRow.has(value.rowId)) {
                valuesByRow.set(value.rowId, []);
            }
            const property = propertiesMap.get(value.propertyId);
            valuesByRow.get(value.rowId)!.push({
                ...value,
                property,
            });
        }

        // Attach values to rows
        return rows.map((row) => ({
            ...row,
            values: valuesByRow.get(row.id) || [],
        }));
    }

    async findOne(databaseId: string, rowId: string, userId: string) {
        const row = await this.pageRepository.findOne({
            where: { id: rowId, parentDatabaseId: databaseId },
        });

        if (!row) {
            throw new NotFoundException('Row not found');
        }

        // Get all values for this row
        const values = await this.propertyValueRepository.find({
            where: { rowId },
        });

        // Get properties
        const properties = await this.propertyRepository.find({
            where: { databaseId },
        });

        const propertiesMap = new Map(properties.map(p => [p.id, p]));

        // Attach property info to each value
        const valuesWithProperties = values.map(v => ({
            ...v,
            property: propertiesMap.get(v.propertyId),
        }));

        return {
            ...row,
            values: valuesWithProperties,
        };
    }

    async updateValue(
        databaseId: string,
        rowId: string,
        updateRowValueDto: UpdateRowValueDto,
        userId: string,
    ) {
        // Verify row exists
        const row = await this.pageRepository.findOne({
            where: { id: rowId, parentDatabaseId: databaseId },
        });

        if (!row) {
            throw new NotFoundException('Row not found');
        }

        // Verify property exists
        const property = await this.propertyRepository.findOne({
            where: { id: updateRowValueDto.propertyId, databaseId },
        });

        if (!property) {
            throw new NotFoundException('Property not found');
        }

        // Find or create the value
        let propertyValue = await this.propertyValueRepository.findOne({
            where: { rowId, propertyId: updateRowValueDto.propertyId },
        });

        if (propertyValue) {
            propertyValue.value = updateRowValueDto.value;
        } else {
            propertyValue = this.propertyValueRepository.create({
                rowId,
                propertyId: updateRowValueDto.propertyId,
                value: updateRowValueDto.value,
            });
        }

        const savedValue = await this.propertyValueRepository.save(propertyValue);

        // If this is the title property, also update the page title
        if (property.type === PropertyType.TITLE) {
            row.title = String(updateRowValueDto.value || 'Untitled');
            await this.pageRepository.save(row);
        }

        return savedValue;
    }

    async remove(databaseId: string, rowId: string, userId: string) {
        const row = await this.pageRepository.findOne({
            where: { id: rowId, parentDatabaseId: databaseId },
        });

        if (!row) {
            throw new NotFoundException('Row not found');
        }

        await this.pageRepository.remove(row);

        return { message: 'Row deleted successfully' };
    }
}
