import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabasesController } from './databases.controller';
import { DatabasesService } from './databases.service';
import { Page } from '../pages/entities/page.entity';
import { DatabaseProperty } from '../database-properties/entities/database-property.entity';
import { DatabaseView } from '../database-views/entities/database-view.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Page, DatabaseProperty, DatabaseView])],
    controllers: [DatabasesController],
    providers: [DatabasesService],
    exports: [DatabasesService],
})
export class DatabasesModule { }
