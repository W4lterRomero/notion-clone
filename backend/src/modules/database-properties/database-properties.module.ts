import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabasePropertiesController } from './database-properties.controller';
import { DatabasePropertiesService } from './database-properties.service';
import { DatabaseProperty } from './entities/database-property.entity';
import { Page } from '../pages/entities/page.entity';

@Module({
    imports: [TypeOrmModule.forFeature([DatabaseProperty, Page])],
    controllers: [DatabasePropertiesController],
    providers: [DatabasePropertiesService],
    exports: [DatabasePropertiesService],
})
export class DatabasePropertiesModule { }
