import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Workspace } from '../../workspaces/entities/workspace.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    name!: string;

    @Column()
    @Exclude()
    password!: string;

    @Column({ nullable: true })
    avatar?: string;

    @OneToMany(() => Workspace, (workspace) => workspace.owner)
    workspaces!: Workspace[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
