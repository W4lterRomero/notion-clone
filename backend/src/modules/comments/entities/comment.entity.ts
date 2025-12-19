import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Page } from '../../pages/entities/page.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    content!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @ManyToOne(() => Page, { onDelete: 'CASCADE' })
    page!: Page;

    @Column()
    pageId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    author!: User;

    @Column()
    authorId!: string;
}
