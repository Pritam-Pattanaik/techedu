import { sql } from '../lib/db.js';
import bcrypt from 'bcryptjs';

async function seed() {
    console.log('🌱 Seeding admin user...');
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const email = 'admin@techedu.com';

        // Check if exists
        const existing = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (existing.length > 0) {
            console.log('✅ Admin user already exists');
        } else {
            await sql`
                INSERT INTO users (email, password, name, role)
                VALUES (${email}, ${hashedPassword}, 'Admin User', 'admin')
            `;
            console.log('🎉 Admin user created: admin@techedu.com / admin123');
        }
    } catch (e) {
        console.error('❌ Seeding failed:', e);
    }
    process.exit(0);
}

seed();
