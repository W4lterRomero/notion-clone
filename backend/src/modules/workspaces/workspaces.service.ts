import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { CreateWorkspaceDto } from './dtos/create-workspace.dto';
import { UpdateWorkspaceDto } from './dtos/update-workspace.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WorkspacesService {
    constructor(
        @InjectRepository(Workspace)
        private workspacesRepository: Repository<Workspace>,
    ) { }

    async create(createWorkspaceDto: CreateWorkspaceDto, user: User) {
        const workspace = this.workspacesRepository.create({
            ...createWorkspaceDto,
            owner: user,
            ownerId: user.id,
        });
        return this.workspacesRepository.save(workspace);
    }

    async findAll(user: User) {
        return this.workspacesRepository.find({
            where: { ownerId: user.id },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string, user: User) {
        const workspace = await this.workspacesRepository.findOne({
            where: { id },
            relations: ['owner'],
        });

        if (!workspace) {
            throw new NotFoundException(`Workspace with ID ${id} not found`);
        }

        if (workspace.owner.id !== user.id) {
            // In future, check members array too
            throw new ForbiddenException('You do not have access to this workspace');
        }

        return workspace;
    }

    async update(id: string, updateWorkspaceDto: UpdateWorkspaceDto, user: User) {
        const workspace = await this.findOne(id, user); // Checks permissions
        Object.assign(workspace, updateWorkspaceDto);
        return this.workspacesRepository.save(workspace);
    }

    async remove(id: string, user: User) {
        const workspace = await this.findOne(id, user); // Checks permissions
        return this.workspacesRepository.remove(workspace);
    }
}
