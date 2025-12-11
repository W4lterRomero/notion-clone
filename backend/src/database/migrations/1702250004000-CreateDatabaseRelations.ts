import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDatabaseRelations1702250004000 implements MigrationInterface {
    name = 'CreateDatabaseRelations1702250004000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE database_relations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                source_row_id UUID NOT NULL,
                target_row_id UUID NOT NULL,
                property_id UUID NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                CONSTRAINT fk_relations_source_row
                    FOREIGN KEY (source_row_id) 
                    REFERENCES pages(id) 
                    ON DELETE CASCADE,
                CONSTRAINT fk_relations_target_row
                    FOREIGN KEY (target_row_id) 
                    REFERENCES pages(id) 
                    ON DELETE CASCADE,
                CONSTRAINT fk_relations_property
                    FOREIGN KEY (property_id) 
                    REFERENCES database_properties(id) 
                    ON DELETE CASCADE,
                CONSTRAINT uq_source_target_property UNIQUE(source_row_id, target_row_id, property_id)
            )
        `);

        await queryRunner.query(`
            CREATE INDEX idx_relations_source ON database_relations(source_row_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_relations_target ON database_relations(target_row_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_relations_property ON database_relations(property_id)
        `);

        await queryRunner.query(`
            COMMENT ON TABLE database_relations IS 'Stores relation links between database rows for relation properties'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_relations_property`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_relations_target`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_relations_source`);
        await queryRunner.query(`DROP TABLE IF EXISTS database_relations`);
    }
}
