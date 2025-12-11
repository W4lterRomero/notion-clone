import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Unique,
    Index,
} from 'typeorm';

@Entity('database_relations')
@Unique(['sourceRowId', 'targetRowId', 'propertyId'])
@Index(['sourceRowId'])
@Index(['targetRowId'])
@Index(['propertyId'])
export class DatabaseRelation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'source_row_id' })
    sourceRowId!: string;

    @Column({ name: 'target_row_id' })
    targetRowId!: string;

    @Column({ name: 'property_id' })
    propertyId!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    // Relations will be added after all entities are created
}
