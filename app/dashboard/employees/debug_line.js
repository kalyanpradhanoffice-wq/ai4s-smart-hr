const fs = require('fs');
const filePath = 'd:\\AntiGravity\\AI4S Smart HR\\app\\dashboard\\employees\\page.js';

try {
    const buf = fs.readFileSync(filePath);
    const content = buf.toString('latin1');
    const lines = content.split(/\r?\n/);
    const line200 = lines[199]; // 0-indexed line 200

    console.log('File length: ' + buf.length);
    console.log('Line 200 (latin1): "' + line200 + '"');
    const lineBuf = Buffer.from(line200 || '', 'latin1');
    console.log('Hex: ' + lineBuf.toString('hex'));
} catch (err) {
    console.error('Error: ' + err.message);
}
