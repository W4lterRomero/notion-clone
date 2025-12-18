import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseRelation } from './entities/database-relation.entity';
import { DatabaseRelationsService } from './database-relations.service';
import { DatabaseRelationsController } from './database-relations.controller';
import { Page } from '../pages/entities/page.entity';
import { DatabaseProperty } from '../database-properties/entities/database-property.entity';

@Module({
    imports: [TypeOrmModule.forFeature([DatabaseRelation, Page, DatabaseProperty])],
    controllers: [DatabaseRelationsController],
    providers: [DatabaseRelationsService],
    exports: [DatabaseRelationsService],
})
export class DatabaseRelationsModule { }

