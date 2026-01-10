import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

// Test User Credentials
const TEST_USER = {
    email: `test_${Date.now()}@student.com`, // Unique email each run
    password: 'password123'
};

let token = '';

const runTest = async () => {
    console.log('🚀 Starting API Verification Check...\n');

    try {
        // 1. Health Check
        console.log('1️⃣  Checking Server Health...');
        const health = await axios.get(`${API_URL}/health`);
        console.log(`   ✅ Status: ${health.data.status} (Uptime: ${health.data.uptime}s)\n`);

        // 2. Auth: Register
        console.log(`2️⃣  Registering User (${TEST_USER.email})...`);
        try {
            await axios.post(`${API_URL}/auth/register`, TEST_USER);
            console.log('   ✅ Registered successfully');
        } catch (err) {
            // Check if it's just "User already exists", otherwise throw
            if (err.response && err.response.data.message === 'User already exists') {
                console.log('   ⚠️  User already exists, proceeding to login...');
            } else {
                throw err;
            }
        }

        // 3. Auth: Login
        console.log('3️⃣  Logging In...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, TEST_USER);
        token = loginRes.data.token;
        console.log('   ✅ Login successful. Token received.\n');

        // Config for auth requests
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 4. Data Seeding: Create Subjects
        console.log('4️⃣  Seeding Subjects...');
        
        // Subject 1: Safe (Maths: 25/30 = 83%) - Target default is 75%
        await axios.post(`${API_URL}/subjects`, {
            name: 'Maths',
            type: 'Theory',
            attended: 25, 
            total: 30
        }, config);
        console.log('   ✅ Created "Maths" (25/30)');

        // Subject 2: Risk (Physics: 5/20 = 25%)
        await axios.post(`${API_URL}/subjects`, {
            name: 'Physics',
            type: 'Lab',
            attended: 5,
            total: 20
        }, config);
        console.log('   ✅ Created "Physics" (5/20)\n');

        // 5. Verification: Fetch and Check Logic
        console.log('5️⃣  Verifying Bunk Logic...');
        const subjectsRes = await axios.get(`${API_URL}/subjects`, config);
        const subjects = subjectsRes.data;

        subjects.forEach(sub => {
            console.log(`   📘 Subject: ${sub.name}`);
            console.log(`      Stats: ${sub.attended}/${sub.total} (${sub.percentage}%)`);
            console.log(`      Status: ${sub.isSafe ? '✅ Safe' : '❌ Risk'}`);
            console.log(`      Message: "${sub.statusMsg}"`); // Checks server-side calculation
            console.log('      -------------------');
        });

        console.log('\n✨ API Verification Completed Successfully!');

    } catch (error) {
        console.error('\n❌ Test Failed!');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        } else {
            console.error('   Error:', error.message);
        }
    }
};

runTest();
