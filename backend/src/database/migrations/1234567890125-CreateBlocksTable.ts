import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateBlocksTable1234567890125 implements MigrationInterface {
    name = 'CreateBlocksTable1234567890125';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for block types
        await queryRunner.query(`
      CREATE TYPE "block_type_enum" AS ENUM (
        'paragraph', 'heading1', 'heading2', 'heading3',
        'bulleted_list', 'numbered_list', 'todo', 'toggle',
        'quote', 'code', 'divider', 'callout', 'image'
      )
    `);

        await queryRunner.createTable(
            new Table({
                name: 'blocks',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'type',
                        type: 'block_type_enum',
                        default: "'paragraph'",
                    },
                    {
                        name: 'content',
                        type: 'text',
                        default: "''",
                    },
                    {
                        name: 'properties',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'position',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'parentId',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'pageId',
                        type: 'uuid',
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        // Create composite index for pageId + position (important for performance)
        await queryRunner.createIndex(
            'blocks',
            new TableIndex({
                name: 'IDX_blocks_page_position',
                columnNames: ['pageId', 'position'],
            }),
        );

        // Foreign key to pages
        await queryRunner.createForeignKey(
            'blocks',
            new TableForeignKey({
                columnNames: ['pageId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'pages',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('blocks');
        await queryRunner.query('DROP TYPE "block_type_enum"');
    }
}
