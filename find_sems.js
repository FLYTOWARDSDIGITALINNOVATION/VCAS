const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git' || f === 'build' || f === 'dist') continue;
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      searchDir(full);
    } else if (f.endsWith('.jsx') || f.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (/\[1,\s*2,\s*3,\s*4,\s*5,\s*6,\s*7,\s*8\]|\[1..8\]|1\s*to\s*8|totalSemesters.*8/i.test(line)) {
          console.log(`${full}:${i + 1}: ${line.trim()}`);
        }
        if (/option.*value.*[78].*semester|option.*semester.*[78]/i.test(line)) {
          console.log(`${full}:${i + 1}: ${line.trim()}`);
        }
        if (/[1-8]\s*(st|nd|rd|th)\s*sem/i.test(line) && /[78]/i.test(line)) {
          console.log(`${full}:${i + 1}: ${line.trim()}`);
        }
      });
    }
  }
}

searchDir('e:\\VCAS\\frontend\\src');
searchDir('e:\\VCAS\\backend\\src');
