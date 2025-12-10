import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    JoinColumn,
} from 'typeorm';
import { Page } from '../../pages/entities/page.entity';

export enum BlockType {
    PARAGRAPH = 'paragraph',
    HEADING_1 = 'heading1',
    HEADING_2 = 'heading2',
    HEADING_3 = 'heading3',
    BULLETED_LIST = 'bulleted_list',
    NUMBERED_LIST = 'numbered_list',
    TODO = 'todo',
    TOGGLE = 'toggle',
    QUOTE = 'quote',
    CODE = 'code',
    DIVIDER = 'divider',
    CALLOUT = 'callout',
    IMAGE = 'image',
}

@Entity('blocks')
@Index(['pageId', 'position'])
export class Block {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({
        type: 'enum',
        enum: BlockType,
        default: BlockType.PARAGRAPH,
    })
    type!: BlockType;

    @Column('text', { default: '' })
    content!: string;

    @Column('jsonb', { nullable: true })
    properties!: Record<string, any> | null;

    @Column('int', { default: 0 })
    position!: number;

    @Column('uuid', { nullable: true })
    parentId!: string | null;

    @ManyToOne(() => Page, (page) => page.blocks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pageId' })
    page!: Page;

    @Column('uuid')
    pageId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
