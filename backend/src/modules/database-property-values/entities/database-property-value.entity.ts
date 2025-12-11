import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
    Unique,
    Index,
} from 'typeorm';

// Value type definitions for different property types
export interface DateValue {
    start: string; // ISO date string
    end?: string;
    includeTime?: boolean;
}

export interface PersonValue {
    userIds: string[];
}

export interface RelationValue {
    rowIds: string[];
}

export type PropertyValue =
    | string           // text, title, url, email, phone
    | number           // number
    | boolean          // checkbox
    | string[]         // multi_select (option names)
    | DateValue        // date
    | PersonValue      // person
    | RelationValue    // relation
    | null;

@Entity('database_property_values')
@Unique(['rowId', 'propertyId'])
@Index(['rowId'])
@Index(['propertyId'])
export class DatabasePropertyValue {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'row_id' })
    rowId!: string;

    @Column({ name: 'property_id' })
    propertyId!: string;

    @Column({ type: 'jsonb', nullable: true })
    value!: PropertyValue;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations will be added after all entities are created
}
