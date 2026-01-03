import { neon, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configure cache for lower latency in serverless environments
neonConfig.fetchConnectionCache = true;

// Helper to get safe connection string
const getConnectionString = () => {
    let url = process.env.DATABASE_URL;
    if (!url) return null;

    if (!url.includes('sslmode=require')) {
        url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
    }
    return url;
};

// Lazy proxy to prevent top-level crash if env var is missing
const sqlProxy = (strings, ...values) => {
    const url = getConnectionString();
    if (!url) {
        throw new Error('DATABASE_URL is not set. Cannot connect to Neon DB.');
    }
    const sql = neon(url);
    return sql(strings, ...values);
};

export const sql = sqlProxy;
