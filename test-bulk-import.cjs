const https = require('https');
const http = require('http');

// Test the bulk import API endpoint
function testBulkImport() {
  console.log('Testing bulk import API...\n');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/products/bulk-import',
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\nResponse:', data.substring(0, 500));
      
      // Try to parse as JSON
      try {
        const json = JSON.parse(data);
        console.log('\n✓ Valid JSON response');
        console.log('Parsed:', json);
      } catch (e) {
        console.log('\n✗ Invalid JSON response');
        console.log('Error:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e.message);
  });

  // Send empty form data to test error handling
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  req.write('--' + boundary + '--\r\n');
  req.end();
}

testBulkImport();
