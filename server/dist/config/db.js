import prisma from './client.js';
export const initDb = async (retries = 5, delay = 2000) => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('DATABASE_URL is not defined in environment variables');
    }
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
    console.log(`Attempting to connect to PostgreSQL at: ${maskedUrl}`);
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await prisma.$connect();
            await prisma.$queryRaw `SELECT 1`;
            console.log('✅ Successfully connected to PostgreSQL via Prisma');
            return;
        }
        catch (error) {
            console.warn(`⚠️  Database connection attempt ${attempt}/${retries} failed:`, error.message);
            if (attempt === retries) {
                console.error('Critical Database Connection Error after all attempts:');
                console.error('Code:', error.code);
                console.error('Message:', error.message);
                throw error;
            }
            await new Promise(res => setTimeout(res, delay));
        }
    }
};
