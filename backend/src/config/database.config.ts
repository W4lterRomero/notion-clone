import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'postgres',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'notion_user',
    password: process.env.POSTGRES_PASSWORD || 'SecurePass123!',
    database: process.env.POSTGRES_DB || 'notion_db',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV === 'development', // Auto-create schema in dev
    logging: process.env.NODE_ENV === 'development',
}));
