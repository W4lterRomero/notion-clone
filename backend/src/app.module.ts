import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { PagesModule } from './modules/pages/pages.module';
import { BlocksModule } from './modules/blocks/blocks.module';
import { DatabasesModule } from './modules/databases/databases.module';
import { DatabasePropertiesModule } from './modules/database-properties/database-properties.module';
import { DatabaseRowsModule } from './modules/database-rows/database-rows.module';
import { DatabaseViewsModule } from './modules/database-views/database-views.module';
import { DatabaseRelationsModule } from './modules/database-relations/database-relations.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, databaseConfig, redisConfig, jwtConfig],
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => configService.get('database') as TypeOrmModuleOptions,
        }),
        HealthModule,
        AuthModule,
        UsersModule,
        WorkspacesModule,
        PagesModule,
        BlocksModule,
        // Database modules
        DatabasesModule,
        DatabasePropertiesModule,
        DatabaseRowsModule,
        DatabaseViewsModule,
        DatabaseRelationsModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule { }


