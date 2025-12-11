import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum ViewType {
    TABLE = 'table',
    BOARD = 'board',
    CALENDAR = 'calendar',
    GALLERY = 'gallery',
    LIST = 'list',
    TIMELINE = 'timeline',
}

// View config interfaces
export interface SortConfig {
    propertyId: string;
    direction: 'asc' | 'desc';
}

export interface FilterCondition {
    propertyId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' |
    'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' |
    'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal';
    value: any;
}

export interface FilterGroup {
    type: 'and' | 'or';
    conditions: (FilterCondition | FilterGroup)[];
}

export interface TableViewConfig {
    visibleProperties: string[];
    propertyWidths: Record<string, number>;
    sorts: SortConfig[];
    filter?: FilterGroup;
    wrapCells?: boolean;
}

export interface BoardViewConfig {
    groupBy: string; // property id (must be select type)
    sorts: SortConfig[];
    filter?: FilterGroup;
    cardPreview: 'none' | 'cover' | 'content';
    hiddenGroups?: string[]; // option values to hide
}

export interface CalendarViewConfig {
    dateProperty: string; // property id
    sorts: SortConfig[];
    filter?: FilterGroup;
    showWeekends: boolean;
}

export interface GalleryViewConfig {
    imageSize: 'small' | 'medium' | 'large';
    fitImage: boolean;
    sorts: SortConfig[];
    filter?: FilterGroup;
    visibleProperties: string[];
}

export type ViewConfig =
    | TableViewConfig
    | BoardViewConfig
    | CalendarViewConfig
    | GalleryViewConfig
    | Record<string, never>;

@Entity('database_views')
@Index(['databaseId', 'position'])
export class DatabaseView {
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
    type!: ViewType;

    @Column({ type: 'jsonb', default: {} })
    config!: ViewConfig;

    @Column({ default: 0 })
    position!: number;

    @Column({ name: 'is_default', default: false })
    isDefault!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations will be added after all entities are created
}
