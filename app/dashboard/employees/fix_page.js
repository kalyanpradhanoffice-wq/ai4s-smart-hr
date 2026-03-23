const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'page.js');

try {
    const buf = fs.readFileSync(filePath);
    console.log('File length: ' + buf.length);
    const hex = buf.slice(0, 50).toString('hex');
    console.log('First 50 bytes hex: ' + hex);
    
    let content = buf.toString('utf8');
    
    // Find "Error updating employee: " + error
    const searchStr = 'Error updating employee: " + error';
    if (content.includes(searchStr)) {
        console.log('Found orphaned toast string');
        
        // Remove the block
        // toast line
        // }
        // }
        // Including the } else { before it if possible
        
        // Regex to match the block with flexible spacing and potential corrupted chars
        const regex = /}\s*\n\s+addToast\("Employee updated successfully!", "success", "âœ…"\);\s+} else {\s+addToast\("Error updating employee: " \+ error, "error", "â Œ"\);\s+}\s+}/g;
        
        if (regex.test(content)) {
            console.log('Matched and removing orphaned block.');
            content = content.replace(regex, '');
        } else {
            console.log('Regex did not match. Trying simpler replacement.');
            // Match the line itself and surrounding braces
            const lines = content.split(/\r?\n/);
            const index = lines.findIndex(l => l.includes(searchStr));
            if (index !== -1) {
                console.log('Found line at index ' + index);
                // remove indices around it
                // ... same logic as before but now we know it's being executed ...
                lines.splice(index-1, 4); // } else {, toast, }, }
                content = lines.join('\n');
            }
        }
    }

    // Fix emojis
    content = content.replace(/âœ…/g, '\\u2705');
    content = content.replace(/â Œ/g, '\\u274c');
    content = content.replace(/âš ï¸ /g, '\\u26a0\\ufe0f');
    content = content.replace(/ðŸ—‘ï¸ /g, '\\ud83d\\uddd1\\ufe0f');
    content = content.replace(/â€”/g, '\u2014');
    content = content.replace(/â‚¹/g, '₹');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Repair complete.');
} catch (err) {
    console.error('Error: ' + err.message);
}
