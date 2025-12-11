import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDatabasePropertyValues1702250003000 implements MigrationInterface {
    name = 'CreateDatabasePropertyValues1702250003000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE database_property_values (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                row_id UUID NOT NULL,
                property_id UUID NOT NULL,
                value JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                CONSTRAINT fk_property_values_row
                    FOREIGN KEY (row_id) 
                    REFERENCES pages(id) 
                    ON DELETE CASCADE,
                CONSTRAINT fk_property_values_property
                    FOREIGN KEY (property_id) 
                    REFERENCES database_properties(id) 
                    ON DELETE CASCADE,
                CONSTRAINT uq_row_property UNIQUE(row_id, property_id)
            )
        `);

        await queryRunner.query(`
            CREATE INDEX idx_property_values_row_id 
            ON database_property_values(row_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_property_values_property_id 
            ON database_property_values(property_id)
        `);

        await queryRunner.query(`
            COMMENT ON TABLE database_property_values IS 'Cell values for each row/property combination in a database'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN database_property_values.value IS 'JSONB value: string for text, number for number, array for multi_select/relation, object for date with start/end'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_property_values_property_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_property_values_row_id`);
        await queryRunner.query(`DROP TABLE IF EXISTS database_property_values`);
    }
}
