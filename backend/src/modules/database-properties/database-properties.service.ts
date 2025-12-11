import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseProperty, PropertyType } from './entities/database-property.entity';
import { Page, PageType } from '../pages/entities/page.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class DatabasePropertiesService {
    constructor(
        @InjectRepository(DatabaseProperty)
        private propertyRepository: Repository<DatabaseProperty>,
        @InjectRepository(Page)
        private pageRepository: Repository<Page>,
    ) { }

    async create(
        databaseId: string,
        createPropertyDto: CreatePropertyDto,
        userId: string,
    ) {
        // Verify database exists
        const database = await this.pageRepository.findOne({
            where: { id: databaseId, type: PageType.DATABASE },
        });

        if (!database) {
            throw new NotFoundException('Database not found');
        }

        // Auto-assign position if not provided
        if (createPropertyDto.position === undefined) {
            const lastProperty = await this.propertyRepository.findOne({
                where: { databaseId },
                order: { position: 'DESC' },
            });

            createPropertyDto.position = lastProperty ? lastProperty.position + 1 : 0;
        }

        // Initialize config based on type if not provided
        if (!createPropertyDto.config) {
            createPropertyDto.config = this.getDefaultConfig(createPropertyDto.type);
        }

        const property = this.propertyRepository.create({
            databaseId,
            ...createPropertyDto,
        });

        return this.propertyRepository.save(property);
    }

    async findAll(databaseId: string, userId: string) {
        return this.propertyRepository.find({
            where: { databaseId },
            order: { position: 'ASC' },
        });
    }

    async update(
        databaseId: string,
        propertyId: string,
        updatePropertyDto: UpdatePropertyDto,
        userId: string,
    ) {
        const property = await this.propertyRepository.findOne({
            where: { id: propertyId, databaseId },
        });

        if (!property) {
            throw new NotFoundException('Property not found');
        }

        Object.assign(property, updatePropertyDto);

        return this.propertyRepository.save(property);
    }

    async remove(databaseId: string, propertyId: string, userId: string) {
        const property = await this.propertyRepository.findOne({
            where: { id: propertyId, databaseId },
        });

        if (!property) {
            throw new NotFoundException('Property not found');
        }

        // Don't allow deleting the only title property
        if (property.type === PropertyType.TITLE) {
            const titleCount = await this.propertyRepository.count({
                where: { databaseId, type: PropertyType.TITLE },
            });

            if (titleCount <= 1) {
                throw new NotFoundException('Cannot delete the only title property');
            }
        }

        await this.propertyRepository.remove(property);

        return { message: 'Property deleted successfully' };
    }

    private getDefaultConfig(type: PropertyType): object {
        switch (type) {
            case PropertyType.SELECT:
            case PropertyType.MULTI_SELECT:
                return { options: [] };
            case PropertyType.NUMBER:
                return { format: 'number' };
            case PropertyType.RELATION:
                return { databaseId: '', type: 'one_to_many' };
            case PropertyType.ROLLUP:
                return { relationPropertyId: '', rollupPropertyId: '', function: 'count' };
            case PropertyType.FORMULA:
                return { expression: '' };
            default:
                return {};
        }
    }
}
