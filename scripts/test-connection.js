import { sql } from '../lib/db.js';

async function testConnection() {
    console.log('Testing DB Connection...');
    try {
        const result = await sql`SELECT NOW()`;
        console.log('✅ Connection Successful:', result);
    } catch (err) {
        console.error('❌ Connection Failed:', err);
        console.error('Details:', JSON.stringify(err, null, 2));
    }
}

testConnection();
