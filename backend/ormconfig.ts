import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './src/modules/users/entities/user.entity';
import { Workspace } from './src/modules/workspaces/entities/workspace.entity';
import { Page } from './src/modules/pages/entities/page.entity';
import { Block } from './src/modules/blocks/entities/block.entity';
import { DatabaseProperty } from './src/modules/database-properties/entities/database-property.entity';
import { DatabasePropertyValue } from './src/modules/database-property-values/entities/database-property-value.entity';
import { DatabaseRelation } from './src/modules/database-relations/entities/database-relation.entity';
import { DatabaseView } from './src/modules/database-views/entities/database-view.entity';

dotenv.config({ path: '.env.local' });

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'notion_user',
    password: process.env.POSTGRES_PASSWORD || 'SecurePass123!',
    database: process.env.POSTGRES_DB || 'notion_db',
    entities: [
        User,
        Workspace,
        Page,
        Block,
        DatabaseProperty,
        DatabasePropertyValue,
        DatabaseRelation,
        DatabaseView,
    ],
    migrations: ['src/database/migrations/*.ts'],
    synchronize: false, // Always false in production/migrations
});

