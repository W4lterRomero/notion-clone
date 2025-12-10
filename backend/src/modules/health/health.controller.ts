import { Controller, Get, Logger } from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
    private readonly logger = new Logger(HealthController.name);

    constructor(private readonly healthService: HealthService) { }

    @Get()
    @Public()
    async check() {
        this.logger.log('Health check requested');
        return this.healthService.check();
    }
}
