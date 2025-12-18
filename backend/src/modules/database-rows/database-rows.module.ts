import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseRowsController } from './database-rows.controller';
import { DatabaseRowsService } from './database-rows.service';
import { Page } from '../pages/entities/page.entity';
import { DatabasePropertyValue } from '../database-property-values/entities/database-property-value.entity';
import { DatabaseProperty } from '../database-properties/entities/database-property.entity';
import { DatabaseRelationsModule } from '../database-relations/database-relations.module';
import { DatabaseRelation } from '../database-relations/entities/database-relation.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Page, DatabasePropertyValue, DatabaseProperty, DatabaseRelation]),
        DatabaseRelationsModule,
    ],
    controllers: [DatabaseRowsController],
    providers: [DatabaseRowsService],
    exports: [DatabaseRowsService],
})
export class DatabaseRowsModule { }
