import { execSync } from 'child_process';
import process from 'process';
// import dotenv from 'dotenv'; // Dotenv is not needed/problematic in ESM if not handled carefully, and Vercel injects envs anyway.

console.log('Sanitizing DATABASE_URL (ESM Version)...');

let dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('CRITICAL: DATABASE_URL is missing!');
    // On Vercel build, sometimes Env vars aren't available until runtime? 
    // But for prisma db push we need it.
    // If missing, we can't push.
    console.error('Checking Vercel System Env...');
} else {
    // Sanitize
    dbUrl = dbUrl.trim().replace(/^["']|["']$/g, '');
    if (dbUrl.startsWith('postgres://')) {
        dbUrl = dbUrl.replace('postgres://', 'postgresql://');
    }
    // Update Env for this process
    process.env.DATABASE_URL = dbUrl;
}

console.log('Running prisma db push...');

try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });
    console.log('Database push successful.');
} catch (error) {
    console.error('Database push failed.');
    process.exit(1);
}
