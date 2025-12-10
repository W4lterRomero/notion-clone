import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1234567890123 implements MigrationInterface {
    name = 'InitialSchema1234567890123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "name" character varying NOT NULL,
                "password" character varying NOT NULL,
                "avatar" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "workspaces" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "icon" character varying,
                "settings" jsonb,
                "ownerId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5296803027b40d6c8e39029699f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "pages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "icon" character varying,
                "cover" character varying,
                "isPublic" boolean NOT NULL DEFAULT false,
                "workspaceId" uuid NOT NULL,
                "parentId" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_20964177e113426e64ec56262b9" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "workspaces" ADD CONSTRAINT "FK_2c639e7280cf17c767425f17173" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "pages" ADD CONSTRAINT "FK_6873528b3d8750697711204d609" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "pages" ADD CONSTRAINT "FK_e1b302c31500f402434b711317a" FOREIGN KEY ("parentId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pages" DROP CONSTRAINT "FK_e1b302c31500f402434b711317a"`);
        await queryRunner.query(`ALTER TABLE "pages" DROP CONSTRAINT "FK_6873528b3d8750697711204d609"`);
        await queryRunner.query(`ALTER TABLE "workspaces" DROP CONSTRAINT "FK_2c639e7280cf17c767425f17173"`);
        await queryRunner.query(`DROP TABLE "pages"`);
        await queryRunner.query(`DROP TABLE "workspaces"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
