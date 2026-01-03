import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

// --- CRITICAL ENVIRONMENT PATCH ---
// This must happen before PrismaClient is used.

let originalUrl = process.env.DATABASE_URL;
let dbUrl = originalUrl || 'postgresql://placeholder';

// 1. Robust Extraction: Find where the protocol starts
const protocolMatch = dbUrl.match(/(postgres|postgresql|neondb):\/\//);
if (protocolMatch) {
    const startIndex = protocolMatch.index;
    if (startIndex > 0) {
        console.log('[DB Config] 🔧 Fix: Extracting URL from garbage prefix');
        dbUrl = dbUrl.substring(startIndex);
    }
}

// 2. Trim whitespace
dbUrl = dbUrl.trim();

// 2. Remove surrounding double quotes
if (dbUrl.startsWith('"') && dbUrl.endsWith('"')) {
    dbUrl = dbUrl.slice(1, -1);
}

// 3. Remove surrounding single quotes
if (dbUrl.startsWith("'") && dbUrl.endsWith("'")) {
    dbUrl = dbUrl.slice(1, -1);
}

// 4. Fix protocol (postgres:// -> postgresql://)
if (dbUrl.startsWith('postgres://')) {
    dbUrl = dbUrl.replace('postgres://', 'postgresql://');
}

// 5. Force patch the environment variable
process.env.DATABASE_URL = dbUrl;

console.log(`[DB Config] URL Length: ${dbUrl.length}`);
console.log(`[DB Config] Protocol: ${dbUrl.split('://')[0]}`);
// ----------------------------------

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: dbUrl,
        },
    },
});

export default prisma;
