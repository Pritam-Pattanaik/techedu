import { execSync } from 'child_process';
import process from 'process';
import 'dotenv/config'; // Load .env for local development

const args = process.argv.slice(2).join(' ');

console.log(`[PrismaWrap] 🛡️  Starting wrapper for: prisma ${args}`);

// 1. Get and Sanitize DATABASE_URL
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl || typeof dbUrl !== 'string') {
    console.warn('[PrismaWrap] ⚠️  DATABASE_URL missing. Using fallback for build compatibility.');
    dbUrl = 'postgresql://placeholder:password@localhost:5432/mydb';
} else {
    // Trim and strip quotes
    dbUrl = dbUrl.trim().replace(/^["']+|["']+$/g, '');

    // Fix Protocol
    if (dbUrl.startsWith('postgres://')) {
        dbUrl = dbUrl.replace('postgres://', 'postgresql://');
    } else if (dbUrl.startsWith('neondb://')) {
        dbUrl = dbUrl.replace('neondb://', 'postgresql://');
    } else if (!dbUrl.includes('://')) {
        // Assume postgresql if no protocol is present
        console.log('[PrismaWrap] 🔧 Protocol missing, appending postgresql://');
        dbUrl = `postgresql://${dbUrl}`;
    }
}

console.log(`[PrismaWrap] ✅ URL Prepared (Length: ${dbUrl.length})`);

// 2. Execute with Shell-Level Export
// We construct a command string that explicitly sets the variable.
// Note: This assumes a Unix-like environment (Vercel/Linux/Mac). 
// For Windows local dev, we might strictly need cross-env, but Vercel is the priority here.
// However, to be safe for both:
// We will modify process.env AND use the env option again, but we'll print the command for clarity.

try {
    process.env.DATABASE_URL = dbUrl;

    // On Vercel (Linux), explicit export in command string is safest to beat other env loaders
    const isWin = process.platform === "win32";
    const cmd = isWin
        ? `npx prisma ${args}`
        : `DATABASE_URL="${dbUrl}" npx prisma ${args}`;

    console.log(`[PrismaWrap] 🚀 Executing: ${cmd}`);

    // We still pass env in options for Windows fallback
    execSync(cmd, {
        stdio: 'inherit',
        env: process.env,
        shell: true // Important for variable expansion
    });

    console.log('[PrismaWrap] 🎉 Success');
} catch (error) {
    console.error('[PrismaWrap] ❌ Command failed');
    process.exit(1);
}
