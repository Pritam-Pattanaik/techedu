import { execSync } from 'child_process';
import process from 'process';

// Get arguments (e.g. "generate" or "db push")
const args = process.argv.slice(2).join(' ');

console.log(`[PrismaWrap] Starting wrapper for command: prisma ${args}`);

// 1. Sanitize DATABASE_URL
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl || typeof dbUrl !== 'string') {
    console.warn('[PrismaWrap] WARNING: DATABASE_URL is missing or invalid. Using placeholder to prevent build crash.');
    // Use a syntactically valid placeholder so "prisma generate" can pass schema validation
    dbUrl = 'postgresql://placeholder:password@localhost:5432/mydb';
} else {
    // Trim
    dbUrl = dbUrl.trim();
    // Remove quotes
    dbUrl = dbUrl.replace(/^["']+|["']+$/g, '');
    // Fix protocol
    if (dbUrl.startsWith('postgres://')) {
        dbUrl = dbUrl.replace('postgres://', 'postgresql://');
    }
    if (dbUrl.startsWith('neondb://')) {
        dbUrl = dbUrl.replace('neondb://', 'postgresql://');
    }
}

// 2. Patch Environment
process.env.DATABASE_URL = dbUrl;

console.log(`[PrismaWrap] Sanitized DATABASE_URL length: ${dbUrl.length}`);

// 3. Execute Command
try {
    // We use --accept-data-loss for db push to avoid interactive prompts in CI
    const cmd = `npx prisma ${args}`;
    console.log(`[PrismaWrap] Executing: ${cmd}`);

    execSync(cmd, {
        stdio: 'inherit',
        env: process.env
    });

    console.log('[PrismaWrap] Success.');
} catch (error) {
    console.error('[PrismaWrap] Command failed.');
    process.exit(1);
}
