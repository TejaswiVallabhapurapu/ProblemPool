const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, '../client/dist/assets/index-BRwWhzCE.js');
if (!fs.existsSync(bundlePath)) {
  console.log('Bundle not found at', bundlePath);
  process.exit(1);
}

const content = fs.readFileSync(bundlePath, 'utf8');
console.log('Bundle size:', content.length);

const regex = /.{0,60}email.{0,60}/gi;
let match;
let count = 0;
while ((match = regex.exec(content)) !== null && count < 50) {
  console.log(`[${count++}] offset ${match.index}:`, match[0]);
}
