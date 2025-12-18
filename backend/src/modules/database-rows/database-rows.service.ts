import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Page, PageType } from '../pages/entities/page.entity';
import { DatabasePropertyValue } from '../database-property-values/entities/database-property-value.entity';
import { DatabaseProperty, PropertyType, RelationConfig, RollupConfig } from '../database-properties/entities/database-property.entity';
import { DatabaseRelationsService } from '../database-relations/database-relations.service';
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
        private relationsService: DatabaseRelationsService,
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

        // Get relations for all rows at once
        const relationsMap = await this.relationsService.getRelationsForRows(rowIds);

        // Collect all target row IDs to fetch their details
        const allTargetRowIds = new Set<string>();
        for (const rowRelations of relationsMap.values()) {
            for (const targetIds of rowRelations.values()) {
                targetIds.forEach(id => allTargetRowIds.add(id));
            }
        }

        // Get related row details for display
        const relatedRowDetails = await this.relationsService.getRelatedRowDetails(
            Array.from(allTargetRowIds),
        );

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

        // Calculate rollups
        const rollupProperties = properties.filter(p => p.type === PropertyType.ROLLUP);

        // Attach values to rows with relation and rollup data
        return rows.map((row) => {
            const rowPropertyValues = valuesByRow.get(row.id) || [];
            const rowRelations = relationsMap.get(row.id) || new Map();

            // Add relation property values with related row details
            for (const property of properties) {
                if (property.type === PropertyType.RELATION) {
                    const targetRowIds = rowRelations.get(property.id) || [];
                    const relatedRows = targetRowIds
                        .map((id: string) => relatedRowDetails.get(id))
                        .filter(Boolean);

                    rowPropertyValues.push({
                        propertyId: property.id,
                        rowId: row.id,
                        value: targetRowIds,
                        relatedRows,
                        property,
                    });
                }
            }

            // Calculate rollup values
            for (const rollupProp of rollupProperties) {
                const rollupConfig = rollupProp.config as RollupConfig;
                const rollupValue = this.calculateRollupValue(
                    rollupConfig,
                    rowRelations,
                    propertiesMap,
                    valuesByRow,
                );
                rowPropertyValues.push({
                    propertyId: rollupProp.id,
                    rowId: row.id,
                    value: rollupValue,
                    property: rollupProp,
                });
            }

            return {
                ...row,
                propertyValues: rowPropertyValues,
            };
        });
    }

    private calculateRollupValue(
        config: RollupConfig,
        rowRelations: Map<string, string[]>,
        propertiesMap: Map<string, DatabaseProperty>,
        valuesByRow: Map<string, any[]>,
    ): number | string | null {
        if (!config.relationPropertyId || !config.rollupPropertyId) {
            return null;
        }

        const relatedRowIds = rowRelations.get(config.relationPropertyId) || [];
        if (relatedRowIds.length === 0) {
            return config.function === 'count' ? 0 : null;
        }

        const rollupProperty = propertiesMap.get(config.rollupPropertyId);
        if (!rollupProperty) {
            return null;
        }

        // For count, just return the number of related rows
        if (config.function === 'count') {
            return relatedRowIds.length;
        }

        // For other functions, get the values from related rows
        const values: number[] = [];
        for (const relatedRowId of relatedRowIds) {
            const rowValues = valuesByRow.get(relatedRowId) || [];
            const propValue = rowValues.find(v => v.propertyId === config.rollupPropertyId);
            if (propValue && typeof propValue.value === 'number') {
                values.push(propValue.value);
            } else if (propValue && !isNaN(Number(propValue.value))) {
                values.push(Number(propValue.value));
            }
        }

        if (values.length === 0) {
            return null;
        }

        switch (config.function) {
            case 'sum':
                return values.reduce((a, b) => a + b, 0);
            case 'average':
                return values.reduce((a, b) => a + b, 0) / values.length;
            case 'min':
                return Math.min(...values);
            case 'max':
                return Math.max(...values);
            case 'range':
                return Math.max(...values) - Math.min(...values);
            default:
                return values.join(', ');
        }
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
            propertyValues: valuesWithProperties,
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
