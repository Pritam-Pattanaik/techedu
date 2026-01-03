// Native fetch is available in Node.js 18+
// import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, path) {
    try {
        console.log(`Testing ${name} (${path})...`);
        const res = await fetch(`${BASE_URL}${path}`);
        const data = await res.json().catch(() => null); // Handle non-JSON responses
        const status = res.status;

        if (res.ok) {
            console.log(`✅ ${name}: Success (${status})`);
            if (data) console.log('   Response:', JSON.stringify(data, null, 2));
        } else {
            console.error(`❌ ${name}: Failed (${status})`);
            if (data) console.error('   Error:', JSON.stringify(data, null, 2));
        }
        return { success: res.ok, data };
    } catch (err) {
        console.error(`❌ ${name}: Network Error`, err.message);
        return { success: false, error: err.message };
    }
}

async function run() {
    console.log('--- Starting Connectivity Verification ---');

    // 1. Test Neon Driver (Direct SQL)
    await testEndpoint('Neon DB Check', '/api/db-test');

    // 2. Test Prisma Connection (via Health Check)
    await testEndpoint('Prisma/Health Check', '/api/health');

    // 3. Test Business Logic (Courses - Neon)
    await testEndpoint('Courses API', '/api/courses');

    console.log('--- Verification Complete ---');
}

run();
