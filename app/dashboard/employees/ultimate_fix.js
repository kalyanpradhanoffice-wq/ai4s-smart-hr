const fs = require('fs');
const path = 'd:\\AntiGravity\\AI4S Smart HR\\app\\dashboard\\employees\\page.js';

const content = fs.readFileSync(path, 'utf8');
const lines = content.split(/\r?\n/);

console.log('Original line count: ' + lines.length);

// We want to keep:
// 0 to 195 (lines 1 to 196)
// Since line 196 is blank, we keep it.
// We remove 196 to 201 (indices for lines 197 to 202)
const newLines = lines.slice(0, 196).concat(lines.slice(202));

console.log('New line count: ' + newLines.length);

let newContent = newLines.join('\n');

// Global emoji fix while we're at it
newContent = newContent.replace(/âœ…/g, '\\u2705');
newContent = newContent.replace(/â Œ/g, '\\u274c');
newContent = newContent.replace(/âš ï¸ /g, '\\u26a0\\ufe0f');
newContent = newContent.replace(/ðŸ—‘ï¸ /g, '\\ud83d\\uddd1\\ufe0f');
newContent = newContent.replace(/â€”/g, '\u2014');
newContent = newContent.replace(/â‚¹/g, '₹');

fs.writeFileSync(path, newContent, 'utf8');
console.log('Ultimate fix done.');
