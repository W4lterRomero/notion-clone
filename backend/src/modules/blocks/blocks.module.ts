import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { Block } from './entities/block.entity';
import { Page } from '../pages/entities/page.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Block, Page])],
    controllers: [BlocksController],
    providers: [BlocksService],
    exports: [BlocksService],
})
export class BlocksModule { }
