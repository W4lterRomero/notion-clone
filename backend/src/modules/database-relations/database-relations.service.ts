import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DatabaseRelation } from './entities/database-relation.entity';
import { Page } from '../pages/entities/page.entity';
import { DatabaseProperty, PropertyType } from '../database-properties/entities/database-property.entity';

@Injectable()
export class DatabaseRelationsService {
    constructor(
        @InjectRepository(DatabaseRelation)
        private relationRepository: Repository<DatabaseRelation>,
        @InjectRepository(Page)
        private pageRepository: Repository<Page>,
        @InjectRepository(DatabaseProperty)
        private propertyRepository: Repository<DatabaseProperty>,
    ) { }

    /**
     * Set relations for a source row and property.
     * Replaces all existing relations with the new set.
     */
    async setRelations(
        sourceRowId: string,
        propertyId: string,
        targetRowIds: string[],
    ): Promise<DatabaseRelation[]> {
        // Validate source row exists
        const sourceRow = await this.pageRepository.findOne({
            where: { id: sourceRowId },
        });
        if (!sourceRow) {
            throw new NotFoundException(`Source row with ID ${sourceRowId} not found`);
        }

        // Validate property exists and is of type RELATION
        const property = await this.propertyRepository.findOne({
            where: { id: propertyId },
        });
        if (!property) {
            throw new NotFoundException(`Property with ID ${propertyId} not found`);
        }
        if (property.type !== PropertyType.RELATION) {
            throw new BadRequestException(`Property ${property.name} is not a relation property`);
        }

        // Get the related database ID from property config
        const config = property.config as { databaseId?: string };
        if (!config?.databaseId) {
            throw new BadRequestException(`Relation property ${property.name} is not configured with a target database`);
        }

        // Validate target rows exist in the related database
        if (targetRowIds.length > 0) {
            const uniqueTargetIds = [...new Set(targetRowIds)]; // Remove duplicates
            const targetRows = await this.pageRepository.find({
                where: { id: In(uniqueTargetIds) },
            });

            if (targetRows.length !== uniqueTargetIds.length) {
                const foundIds = new Set(targetRows.map(r => r.id));
                const missingIds = uniqueTargetIds.filter(id => !foundIds.has(id));
                throw new NotFoundException(`Target rows not found: ${missingIds.join(', ')}`);
            }

            // Verify target rows belong to the correct database
            const invalidTargets = targetRows.filter(r => r.parentDatabaseId !== config.databaseId);
            if (invalidTargets.length > 0) {
                throw new BadRequestException(
                    `Some target rows do not belong to the related database: ${invalidTargets.map(r => r.title || r.id).join(', ')}`
                );
            }
        }

        // Delete existing relations for this source row and property
        await this.relationRepository.delete({
            sourceRowId,
            propertyId,
        });

        if (targetRowIds.length === 0) {
            return [];
        }

        // Create new relations (use unique IDs)
        const uniqueIds = [...new Set(targetRowIds)];
        const relations = uniqueIds.map((targetRowId) =>
            this.relationRepository.create({
                sourceRowId,
                targetRowId,
                propertyId,
            }),
        );

        return this.relationRepository.save(relations);
    }

    /**
     * Get all relations for a source row, grouped by property
     */
    async getRelationsForRow(
        rowId: string,
    ): Promise<Map<string, DatabaseRelation[]>> {
        const relations = await this.relationRepository.find({
            where: { sourceRowId: rowId },
        });

        const grouped = new Map<string, DatabaseRelation[]>();
        for (const relation of relations) {
            if (!grouped.has(relation.propertyId)) {
                grouped.set(relation.propertyId, []);
            }
            grouped.get(relation.propertyId)!.push(relation);
        }

        return grouped;
    }

    /**
     * Get all relations for multiple rows at once (for batch loading)
     */
    async getRelationsForRows(
        rowIds: string[],
    ): Promise<Map<string, Map<string, string[]>>> {
        if (rowIds.length === 0) {
            return new Map();
        }

        const relations = await this.relationRepository.find({
            where: { sourceRowId: In(rowIds) },
        });

        // Map: rowId -> propertyId -> targetRowIds[]
        const result = new Map<string, Map<string, string[]>>();

        for (const relation of relations) {
            if (!result.has(relation.sourceRowId)) {
                result.set(relation.sourceRowId, new Map());
            }
            const rowMap = result.get(relation.sourceRowId)!;
            if (!rowMap.has(relation.propertyId)) {
                rowMap.set(relation.propertyId, []);
            }
            rowMap.get(relation.propertyId)!.push(relation.targetRowId);
        }

        return result;
    }

    /**
     * Get related row details for displaying in UI
     */
    async getRelatedRowDetails(
        targetRowIds: string[],
    ): Promise<Map<string, { id: string; title: string; icon: string | null }>> {
        if (targetRowIds.length === 0) {
            return new Map();
        }

        const rows = await this.pageRepository.find({
            where: { id: In(targetRowIds) },
            select: ['id', 'title', 'icon'],
        });

        const result = new Map<string, { id: string; title: string; icon: string | null }>();
        for (const row of rows) {
            result.set(row.id, {
                id: row.id,
                title: row.title || 'Untitled',
                icon: row.icon ?? null,
            });
        }

        return result;
    }
}
