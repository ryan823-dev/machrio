// Script to read and analyze the product xlsx file
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '../../产品信息2602251142.xlsx');
console.log('Reading file:', filePath);

try {
  const workbook = XLSX.readFile(filePath);
  
  console.log('\n=== Workbook Info ===');
  console.log('Sheet names:', workbook.SheetNames);
  
  // Read each sheet
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n=== Sheet ${index + 1}: ${sheetName} ===`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log('Total rows:', data.length);
    
    // Show headers (first row)
    if (data.length > 0) {
      console.log('\nHeaders (columns):');
      const headers = data[0];
      headers.forEach((h, i) => {
        console.log(`  [${i}] ${h}`);
      });
      
      // Show first 3 data rows as sample
      console.log('\nSample data (first 3 rows):');
      for (let i = 1; i <= Math.min(3, data.length - 1); i++) {
        console.log(`\nRow ${i}:`);
        const row = data[i];
        headers.forEach((h, j) => {
          if (row[j] !== undefined && row[j] !== '') {
            const value = String(row[j]).substring(0, 100);
            console.log(`  ${h}: ${value}${String(row[j]).length > 100 ? '...' : ''}`);
          }
        });
      }
    }
  });
  
  // Output as JSON for further processing
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(firstSheet);
  console.log('\n=== JSON Output (first 2 products) ===');
  console.log(JSON.stringify(jsonData.slice(0, 2), null, 2));
  
} catch (error) {
  console.error('Error reading file:', error.message);
}
