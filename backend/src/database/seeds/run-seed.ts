import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Workspace } from '../../modules/workspaces/entities/workspace.entity';
import { Page } from '../../modules/pages/entities/page.entity';
import { Block, BlockType } from '../../modules/blocks/entities/block.entity';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: '.env.local' });

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'postgres',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'notion_user',
    password: process.env.POSTGRES_PASSWORD || 'SecurePass123!',
    database: process.env.POSTGRES_DB || 'notion_db',
    entities: [User, Workspace, Page, Block],
});

async function runSeed() {
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const userRepository = queryRunner.manager.getRepository(User);
        const workspaceRepository = queryRunner.manager.getRepository(Workspace);
        const pageRepository = queryRunner.manager.getRepository(Page);
        const blockRepository = queryRunner.manager.getRepository(Block);

        // Create Admin User
        const existingAdmin = await userRepository.findOne({ where: { email: 'admin@notion.local' } });
        let admin = existingAdmin;

        if (!existingAdmin) {
            console.log('Seeding admin user...');
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash('admin123', salt);
            admin = userRepository.create({
                name: 'Admin User',
                email: 'admin@notion.local',
                password: hashedPassword,
            });
            await userRepository.save(admin);
        }

        // Create Demo Workspace
        const existingWorkspace = await workspaceRepository.findOne({ where: { name: 'My First Workspace', ownerId: admin?.id } });
        let workspace = existingWorkspace;

        if (!existingWorkspace && admin) {
            console.log('Seeding demo workspace...');
            workspace = workspaceRepository.create({
                name: 'My First Workspace',
                icon: '🚀',
                owner: admin,
                ownerId: admin.id,
            });
            await workspaceRepository.save(workspace);
        }

        // Create Welcome Page
        let demoPage: Page | null = null;
        if (workspace) {
            const existingPage = await pageRepository.findOne({ where: { title: 'Welcome', workspaceId: workspace.id } });
            if (!existingPage) {
                console.log('Seeding welcome page...');
                demoPage = pageRepository.create({
                    title: 'Welcome',
                    icon: '👋',
                    workspace: workspace,
                    workspaceId: workspace.id,
                    isPublic: true,
                });
                await pageRepository.save(demoPage);
            } else {
                demoPage = existingPage;
            }
        }

        // Create Sample Blocks
        if (demoPage) {
            const existingBlocks = await blockRepository.find({ where: { pageId: demoPage.id } });
            if (existingBlocks.length === 0) {
                console.log('Seeding sample blocks...');
                const sampleBlocks = [
                    {
                        type: BlockType.HEADING_1,
                        content: 'Welcome to Your First Page',
                        position: 0,
                        pageId: demoPage.id,
                    },
                    {
                        type: BlockType.PARAGRAPH,
                        content: 'This is your first block. Click to edit, or press Enter to create a new block.',
                        position: 1,
                        pageId: demoPage.id,
                    },
                    {
                        type: BlockType.HEADING_2,
                        content: 'Try These Features',
                        position: 2,
                        pageId: demoPage.id,
                    },
                    {
                        type: BlockType.BULLETED_LIST,
                        content: 'Rich text editing with formatting',
                        position: 3,
                        pageId: demoPage.id,
                    },
                    {
                        type: BlockType.BULLETED_LIST,
                        content: 'Multiple block types (headings, lists, quotes, code)',
                        position: 4,
                        pageId: demoPage.id,
                    },
                    {
                        type: BlockType.BULLETED_LIST,
                        content: 'Drag and drop to reorder blocks',
                        position: 5,
                        pageId: demoPage.id,
                    },
                    {
                        type: BlockType.TODO,
                        content: 'Try checking this todo item',
                        position: 6,
                        pageId: demoPage.id,
                        properties: { checked: false },
                    },
                    {
                        type: BlockType.QUOTE,
                        content: '"The best way to predict the future is to invent it." - Alan Kay',
                        position: 7,
                        pageId: demoPage.id,
                    },
                    {
                        type: BlockType.CODE,
                        content: 'const greeting = "Hello, Notion Clone!";\nconsole.log(greeting);',
                        position: 8,
                        pageId: demoPage.id,
                        properties: { language: 'javascript' },
                    },
                ];

                for (const blockData of sampleBlocks) {
                    const block = blockRepository.create(blockData);
                    await blockRepository.save(block);
                }
                console.log(`✅ Created ${sampleBlocks.length} sample blocks`);
            }
        }

        await queryRunner.commitTransaction();
        console.log('Seeding completed! 🌱');
    } catch (err) {
        console.error(err);
        await queryRunner.rollbackTransaction();
    } finally {
        await queryRunner.release();
        await AppDataSource.destroy();
    }
}

runSeed();
