import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
    url: process.env.REDIS_URL || 'redis://:RedisPass456!@redis:6379',
}));
