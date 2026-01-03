import { neon, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configure cache for lower latency in serverless environments
neonConfig.fetchConnectionCache = true;

// Validate environment variable
if (!process.env.DATABASE_URL) {
    // In development, we might not have it set yet, but we should warn
    console.warn('⚠️  DATABASE_URL is not set. Database calls will fail.');
}

// Ensure SSL connection is enforced for Neon
const getConnectionString = () => {
    let url = process.env.DATABASE_URL || '';
    if (url && !url.includes('sslmode=require')) {
        url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
    }
    return url;
};

export const sql = neon(getConnectionString());
