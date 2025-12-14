import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    UnauthorizedException,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dtos/create-workspace.dto';
import { UpdateWorkspaceDto } from './dtos/update-workspace.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('workspaces')
export class WorkspacesController {
    constructor(private readonly workspacesService: WorkspacesService) { }

    @Post()
    create(
        @Body() createWorkspaceDto: CreateWorkspaceDto,
        @CurrentUser() user: User,
    ) {
        console.log('Creating workspace, user:', user ? { id: user.id, email: user.email } : 'NO USER');
        if (!user || !user.id) {
            throw new UnauthorizedException('User not authenticated');
        }
        return this.workspacesService.create(createWorkspaceDto, user);
    }

    @Get()
    findAll(@CurrentUser() user: User) {
        return this.workspacesService.findAll(user);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: User) {
        return this.workspacesService.findOne(id, user);
    }

    @Get(':id/members')
    async getMembers(@Param('id') id: string, @CurrentUser() user: User) {
        const workspace = await this.workspacesService.findOne(id, user);
        // Return owner as the only member for now
        // In the future, this could return all members of the workspace
        if (workspace.owner) {
            return [{
                id: workspace.owner.id,
                name: workspace.owner.name || '',
                email: workspace.owner.email,
            }];
        }
        return [];
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateWorkspaceDto: UpdateWorkspaceDto,
        @CurrentUser() user: User,
    ) {
        return this.workspacesService.update(id, updateWorkspaceDto, user);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: User) {
        return this.workspacesService.remove(id, user);
    }
}
