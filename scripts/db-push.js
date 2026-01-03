import { execSync } from 'child_process';
import process from 'process';

console.log('Sanitizing DATABASE_URL...');

let dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('CRITICAL: DATABASE_URL is missing!');
    process.exit(1);
}

// Sanitize
dbUrl = dbUrl.trim().replace(/^["']|["']$/g, '');
if (dbUrl.startsWith('postgres://')) {
    dbUrl = dbUrl.replace('postgres://', 'postgresql://');
}

// Update Env for this process
process.env.DATABASE_URL = dbUrl;

console.log('DATABASE_URL sanitized. Running prisma db push...');

try {
    // Inherit stdio so we see output
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });
    console.log('Database push successful.');
} catch (error) {
    console.error('Database push failed.');
    process.exit(1);
}
