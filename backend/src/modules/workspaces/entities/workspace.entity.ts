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
import { User } from '../../users/entities/user.entity';
import { Page } from '../../pages/entities/page.entity';

@Entity('workspaces')
export class Workspace {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column({ nullable: true })
    icon?: string;

    @Column({ type: 'jsonb', nullable: true })
    settings?: Record<string, any>;

    @ManyToOne(() => User, (user) => user.workspaces, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ownerId' })
    owner!: User;

    @Column()
    ownerId!: string;

    @OneToMany(() => Page, (page) => page.workspace)
    pages!: Page[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
