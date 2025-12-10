import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
    let controller: HealthController;
    let service: HealthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                {
                    provide: HealthService,
                    useValue: {
                        check: jest.fn().mockResolvedValue({ status: 'ok' }),
                    },
                },
            ],
        }).compile();

        controller = module.get<HealthController>(HealthController);
        service = module.get<HealthService>(HealthService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return health status', async () => {
        expect(await controller.check()).toEqual({ status: 'ok' });
    });
});
