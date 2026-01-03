// Native fetch is available in Node.js 18+
// import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testLogin() {
    console.log('--- Testing Login Endpoint ---');

    // 1. Valid Credentials
    try {
        console.log('1. Testing Valid Credentials...');
        const res = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@techedu.com',
                password: 'admin123'
            })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            console.log('✅ Login Success:', data);
        } else {
            console.error('❌ Login Failed:', res.status, data);
        }
    } catch (e) {
        console.error('❌ Network/Server Error:', e.message);
    }

    // 2. Invalid Credentials
    try {
        console.log('\n2. Testing Invalid Credentials...');
        const res = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@techedu.com',
                password: 'wrongpassword'
            })
        });
        const data = await res.json();

        if (res.status === 401) {
            console.log('✅ Correctly rejected invalid credentials:', data);
        } else {
            console.error('❌ Unexpected behavior:', res.status, data);
        }
    } catch (e) {
        console.error('❌ Network/Server Error:', e.message);
    }
}

testLogin();
