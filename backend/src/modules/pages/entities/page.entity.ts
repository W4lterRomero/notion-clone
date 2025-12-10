import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Block } from '../../blocks/entities/block.entity';

@Entity('pages')
export class Page {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    title!: string;

    @Column({ nullable: true })
    icon?: string;

    @Column({ nullable: true })
    cover?: string;

    @Column({ default: false })
    isPublic!: boolean;

    @ManyToOne(() => Workspace, (workspace) => workspace.pages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'workspaceId' })
    workspace!: Workspace;

    @Column()
    workspaceId!: string;

    @ManyToOne(() => Page, (page) => page.children, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parentId' })
    parent?: Page;

    @Column({ nullable: true })
    parentId?: string;

    @OneToMany(() => Page, (page) => page.parent)
    children!: Page[];

    @OneToMany(() => Block, (block) => block.page)
    blocks!: Block[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

