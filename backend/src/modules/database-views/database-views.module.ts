import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseViewsController } from './database-views.controller';
import { DatabaseViewsService } from './database-views.service';
import { DatabaseView } from './entities/database-view.entity';
import { Page } from '../pages/entities/page.entity';

@Module({
    imports: [TypeOrmModule.forFeature([DatabaseView, Page])],
    controllers: [DatabaseViewsController],
    providers: [DatabaseViewsService],
    exports: [DatabaseViewsService],
})
export class DatabaseViewsModule { }
