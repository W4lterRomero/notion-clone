import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseRelation } from './entities/database-relation.entity';
import { DatabaseRelationsService } from './database-relations.service';
import { DatabaseRelationsController } from './database-relations.controller';
import { Page } from '../pages/entities/page.entity';

@Module({
    imports: [TypeOrmModule.forFeature([DatabaseRelation, Page])],
    controllers: [DatabaseRelationsController],
    providers: [DatabaseRelationsService],
    exports: [DatabaseRelationsService],
})
export class DatabaseRelationsModule { }
