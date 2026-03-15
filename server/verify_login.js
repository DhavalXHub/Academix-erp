const mongoose = require('mongoose');
const http = require('http');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const testUser = {
    name: 'Verification User',
    email: 'verify@test.play',
    password: 'password123',
    role: 'student'
};

const makeRequest = (postData) => {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(postData);
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
};

const runVerification = async () => {
    try {
        console.log('--- Starting Verification ---');

        // 1. Cleanup old test user if exists
        await User.deleteOne({ email: testUser.email });

        // 2. Create Test User
        // Need to create via Model to trigger pre-save hash
        await User.create(testUser);
        console.log('✅ Test User Created');

        // 3. Test Case A: Valid Login (Correct Role)
        console.log('\nTesting Valid Login (Role: student)...');
        const res1 = await makeRequest({
            email: testUser.email,
            password: testUser.password,
            role: 'student'
        });

        if (res1.statusCode === 200 && res1.body.token) {
            console.log('✅ PASS: Login successful with correct role.');
        } else {
            console.error('❌ FAIL: Login failed with correct role.', res1.body);
        }

        // 4. Test Case B: Invalid Role
        console.log('\nTesting Invalid Role Login (Role: faculty)...');
        const res2 = await makeRequest({
            email: testUser.email,
            password: testUser.password,
            role: 'faculty'
        });

        if (res2.statusCode === 401 && res2.body.message.includes('Invalid role')) {
            console.log('✅ PASS: Login rejected with incorrect role.');
        } else {
            console.error('❌ FAIL: Login should have failed.', res2.statusCode, res2.body);
        }

        // 5. Cleanup
        await User.deleteOne({ email: testUser.email });
        console.log('\n✅ Cleanup done.');

        console.log('\n--- Verification Complete ---');
        process.exit(0);

    } catch (error) {
        console.error('Verification Error:', error);
        await User.deleteOne({ email: testUser.email });
        process.exit(1);
    }
};

// Wait a bit for DB connection? connectDB is async but usually mongoose queues commands.
// But better to wait for 'open' event if possible, or just delay slightly.
// connectDB in this project logs "MongoDB Connected", let's just wait 1 sec.
setTimeout(runVerification, 2000);
