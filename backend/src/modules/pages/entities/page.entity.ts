import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Block } from '../../blocks/entities/block.entity';

export enum PageType {
    PAGE = 'page',
    DATABASE = 'database',
}

@Entity('pages')
@Index(['workspaceId'])
@Index(['parentId'])
@Index(['type'])
@Index(['parentDatabaseId'])
export class Page {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: true })
    title!: string;

    @Column({ nullable: true })
    icon?: string;

    @Column({ nullable: true })
    cover?: string;

    @Column({ name: 'is_public', default: false })
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

    // ===== DATABASE FIELDS (R30) =====

    @Column({
        type: 'varchar',
        length: 20,
        default: PageType.PAGE,
    })
    type!: PageType;

    @Column({ name: 'parent_database_id', nullable: true })
    parentDatabaseId?: string;

    @ManyToOne(() => Page, (page) => page.databaseRows, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'parent_database_id' })
    parentDatabase?: Page;

    // When this page IS a database, these are its rows
    @OneToMany(() => Page, (page) => page.parentDatabase)
    databaseRows!: Page[];

    // ===== END DATABASE FIELDS =====

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
