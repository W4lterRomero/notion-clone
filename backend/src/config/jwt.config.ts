import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars',
    expiration: process.env.JWT_EXPIRATION || '7d',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'another-secret-for-refresh-tokens-min-32-chars',
    refreshExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '30d',
}));
