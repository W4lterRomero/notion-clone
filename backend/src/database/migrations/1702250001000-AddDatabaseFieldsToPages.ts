import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDatabaseFieldsToPages1702250001000 implements MigrationInterface {
    name = 'AddDatabaseFieldsToPages1702250001000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add type column to pages (page or database)
        await queryRunner.query(`
            ALTER TABLE pages 
            ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'page'
        `);

        // Add parent_database_id for rows that belong to a database
        await queryRunner.query(`
            ALTER TABLE pages 
            ADD COLUMN IF NOT EXISTS parent_database_id UUID
        `);

        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE pages 
            ADD CONSTRAINT fk_pages_parent_database 
            FOREIGN KEY (parent_database_id) 
            REFERENCES pages(id) ON DELETE CASCADE
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(type)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_pages_parent_database ON pages(parent_database_id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_pages_parent_database`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_pages_type`);
        await queryRunner.query(`ALTER TABLE pages DROP CONSTRAINT IF EXISTS fk_pages_parent_database`);
        await queryRunner.query(`ALTER TABLE pages DROP COLUMN IF EXISTS parent_database_id`);
        await queryRunner.query(`ALTER TABLE pages DROP COLUMN IF EXISTS type`);
    }
}
