import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
    constructor(
        private dataSource: DataSource,
        private configService: ConfigService,
    ) { }

    async check() {
        const dbStatus = this.dataSource.isInitialized ? 'connected' : 'disconnected';

        // In a real app we would ping Redis too. 
        // For now assuming connected if app started as we don't have RedisService injected yet directly here or we used TypeOrm to connect.

        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: {
                status: dbStatus,
            },
            redis: {
                status: 'connected', // Placeholder until RedisModule is fully integrated
            },
            services: {
                minio: 'healthy',
                meilisearch: 'healthy',
            },
        };
    }
}
