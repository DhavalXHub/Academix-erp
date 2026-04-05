const http = require('http');

const data = JSON.stringify({
    email: 'student1@academix.edu',
    password: 'password123',
    role: 'student'
});

const options = {
    hostname: 'localhost',
    port: 5005,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => console.log('Response:', raw));
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
