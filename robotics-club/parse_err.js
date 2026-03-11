const fs = require('fs');
const txt = fs.readFileSync('build_err.txt', 'utf16le');
const lines = txt.split('\n');
let out = [];
lines.forEach((l, i) => { 
  if (l.includes('Error:') || l.includes('./src')) out.push(l.trim()); 
});
fs.writeFileSync('clean_errors.txt', out.join('\n'));
