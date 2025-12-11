import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
    Index,
} from 'typeorm';

export enum PropertyType {
    TITLE = 'title',
    TEXT = 'text',
    NUMBER = 'number',
    SELECT = 'select',
    MULTI_SELECT = 'multi_select',
    DATE = 'date',
    PERSON = 'person',
    CHECKBOX = 'checkbox',
    URL = 'url',
    EMAIL = 'email',
    PHONE = 'phone',
    RELATION = 'relation',
    ROLLUP = 'rollup',
    FORMULA = 'formula',
    CREATED_TIME = 'created_time',
    CREATED_BY = 'created_by',
    LAST_EDITED_TIME = 'last_edited_time',
    LAST_EDITED_BY = 'last_edited_by',
}

// Property config interfaces for type safety
export interface SelectOption {
    id: string;
    name: string;
    color: string;
}

export interface SelectConfig {
    options: SelectOption[];
}

export interface NumberConfig {
    format: 'number' | 'dollar' | 'euro' | 'percent';
}

export interface RelationConfig {
    databaseId: string;
    type: 'one_to_many' | 'many_to_many';
    syncedPropertyId?: string; // For bidirectional relations
}

export interface RollupConfig {
    relationPropertyId: string;
    rollupPropertyId: string;
    function: 'count' | 'sum' | 'average' | 'min' | 'max' | 'range' | 'show_original';
}

export interface FormulaConfig {
    expression: string;
}

export type PropertyConfig =
    | SelectConfig
    | NumberConfig
    | RelationConfig
    | RollupConfig
    | FormulaConfig
    | Record<string, never>;

@Entity('database_properties')
@Index(['databaseId', 'position'])
export class DatabaseProperty {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'database_id' })
    databaseId!: string;

    @Column({ length: 255 })
    name!: string;

    @Column({
        type: 'varchar',
        length: 50,
    })
    type!: PropertyType;

    @Column({ type: 'jsonb', default: {} })
    config!: PropertyConfig;

    @Column({ default: 0 })
    position!: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations will be added after all entities are created to avoid circular imports
}
