import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DatabaseRelation } from './entities/database-relation.entity';
import { Page } from '../pages/entities/page.entity';

@Injectable()
export class DatabaseRelationsService {
    constructor(
        @InjectRepository(DatabaseRelation)
        private relationRepository: Repository<DatabaseRelation>,
        @InjectRepository(Page)
        private pageRepository: Repository<Page>,
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
        // Delete existing relations for this source row and property
        await this.relationRepository.delete({
            sourceRowId,
            propertyId,
        });

        if (targetRowIds.length === 0) {
            return [];
        }

        // Create new relations
        const relations = targetRowIds.map((targetRowId) =>
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
