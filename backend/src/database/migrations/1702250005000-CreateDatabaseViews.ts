import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDatabaseViews1702250005000 implements MigrationInterface {
    name = 'CreateDatabaseViews1702250005000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE database_views (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                database_id UUID NOT NULL,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                config JSONB DEFAULT '{}',
                position INTEGER NOT NULL DEFAULT 0,
                is_default BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                CONSTRAINT fk_database_views_database
                    FOREIGN KEY (database_id) 
                    REFERENCES pages(id) 
                    ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX idx_database_views_database_id 
            ON database_views(database_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_database_views_position 
            ON database_views(database_id, position)
        `);

        await queryRunner.query(`
            COMMENT ON TABLE database_views IS 'Different views of a database: table, board, calendar, gallery, list, timeline'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN database_views.type IS 'View types: table, board, calendar, gallery, list, timeline'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN database_views.config IS 'View configuration: visible_properties, sorts, filters, group_by, card_preview, etc'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_database_views_position`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_database_views_database_id`);
        await queryRunner.query(`DROP TABLE IF EXISTS database_views`);
    }
}
