import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';
import { Page } from './entities/page.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Page]),
        WorkspacesModule,
    ],
    controllers: [PagesController],
    providers: [PagesService],
    exports: [PagesService],
})
export class PagesModule { }
