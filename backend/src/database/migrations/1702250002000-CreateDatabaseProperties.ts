import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDatabaseProperties1702250002000 implements MigrationInterface {
    name = 'CreateDatabaseProperties1702250002000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE database_properties (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                database_id UUID NOT NULL,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                config JSONB DEFAULT '{}',
                position INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                CONSTRAINT fk_database_properties_database
                    FOREIGN KEY (database_id) 
                    REFERENCES pages(id) 
                    ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX idx_database_properties_database_id 
            ON database_properties(database_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_database_properties_position 
            ON database_properties(database_id, position)
        `);

        await queryRunner.query(`
            COMMENT ON TABLE database_properties IS 'Columns/properties of a Notion-style database'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN database_properties.type IS 'Property types: title, text, number, select, multi_select, date, person, checkbox, url, email, phone, relation, rollup, formula, created_time, created_by, last_edited_time, last_edited_by'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN database_properties.config IS 'Type-specific configuration: options for select, format for number, relation config, rollup config, formula expression'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_database_properties_position`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_database_properties_database_id`);
        await queryRunner.query(`DROP TABLE IF EXISTS database_properties`);
    }
}
