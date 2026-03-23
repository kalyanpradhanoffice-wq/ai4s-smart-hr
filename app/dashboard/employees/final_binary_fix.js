const fs = require('fs');
const path = 'd:\\AntiGravity\\AI4S Smart HR\\app\\dashboard\\employees\\page.js';

let buf = fs.readFileSync(path);

// Search for the sequence â Œ");
// In UTF-8/Hex: E2 9D 8C 22 29 3B
const target = Buffer.from([0xE2, 0x9D, 0x8C, 0x22, 0x29, 0x3B]);

let offset = buf.indexOf(target);
if (offset !== -1) {
    console.log('Found corrupted sequence at offset ' + offset);
    // Replace with spaces
    for (let i = 0; i < target.length; i++) {
        buf[offset + i] = 32;
    }
} else {
    console.log('Corrupted sequence not found by exact bytes. Trying hex search...');
    // Maybe it's not the exact byte sequence I expected?
    // Let's try searching for just the string "â Œ"
    const target2 = Buffer.from('â Œ', 'utf8');
    let offset2 = buf.indexOf(target2);
    if (offset2 !== -1) {
        console.log('Found â Œ at offset ' + offset2);
        for (let i = 0; i < target2.length; i++) {
            buf[offset2 + i] = 32;
        }
    }
}

// Fix emojis throughout the rest of the file
let content = buf.toString('utf8');
content = content.replace(/âœ…/g, '\\u2705');
content = content.replace(/â Œ/g, '\\u274c');
content = content.replace(/âš ï¸ /g, '\\u26a0\\ufe0f');
content = content.replace(/ðŸ—‘ï¸ /g, '\\ud83d\\uddd1\\ufe0f');
content = content.replace(/â€”/g, '\u2014');
content = content.replace(/â‚¹/g, '₹');

// Remove the orphaned braces if they are now just empty lines
// We know they are around line 200.
let lines = content.split(/\r?\n/);
let foundBraces = false;
for (let i = 190; i < 210; i++) {
    if (lines[i] && lines[i].trim() === '}' && lines[i+1] && lines[i+1].trim() === '}') {
        console.log('Found orphaned braces at indices ' + i + ', ' + (i+1));
        lines.splice(i, 2);
        foundBraces = true;
        break;
    }
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Final fix finished.');
