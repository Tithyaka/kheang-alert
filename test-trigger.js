const http = require('http');

const data = JSON.stringify({
  event: 'donation',
  name: 'សុខសាន្ត',
  amount: 50,
  message: 'សួស្តីបងខៀង! នេះសម្រាប់ទិញកាហ្វេ។'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/test-alert',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Username': 'kheangg',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
