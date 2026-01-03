import { neon, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configure cache for lower latency in serverless environments
neonConfig.fetchConnectionCache = true;

// Helper to mask secrets in logs
const maskUrl = (url) => {
    if (!url) return 'undefined';
    try {
        return url.replace(/(:[^:@]+@)/, ':****@');
    } catch {
        return 'invalid-url-format';
    }
};

// Helper to get safe connection string
const getConnectionString = () => {
    let url = process.env.DATABASE_URL;
    if (!url) return null;

    // Sanitize: Trim and remove quotes
    url = url.trim().replace(/^["']+|["']+$/g, '');

    // Protocol fixes
    if (url.startsWith('postgres://')) {
        url = url.replace('postgres://', 'postgresql://');
    }
    if (url.startsWith('neondb://')) {
        url = url.replace('neondb://', 'postgresql://');
    }

    // Ensure SSL for cloud databases
    if (url.includes('sslmode=require')) {
        // Already has it, good.
    } else {
        // Append it
        url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
    }

    return url;
};

// Lazy proxy to prevent top-level crash if env var is missing
const sqlProxy = (strings, ...values) => {
    const url = getConnectionString();
    if (!url) {
        console.error('[DB] DATABASE_URL is missing!');
        throw new Error('DATABASE_URL is not set. Cannot connect to Neon DB.');
    }
    try {
        const sql = neon(url);
        return sql(strings, ...values);
    } catch (err) {
        console.error(`[DB] Connection Failed. URL: ${maskUrl(url)}`);
        throw err;
    }
};

export const sql = sqlProxy;
