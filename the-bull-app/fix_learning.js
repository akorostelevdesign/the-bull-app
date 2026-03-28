const fs = require('fs');
const path = 'src/data/learning-content.js';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);
console.log('\n=== Lines 608-645 (around corruption) ===');
for (let i = 607; i < 645 && i < lines.length; i++) {
  const line = lines[i];
  // Show first 120 chars
  console.log(`L${i+1}: ${line.substring(0, 120)}`);
}

// Try to parse with acorn to find exact error location
try {
  new Function(content.replace(/^export /gm, ''));
  console.log('\n✅ File parses OK');
} catch (e) {
  console.log('\n❌ Parse error:', e.message);
}
