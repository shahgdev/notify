const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src'));
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace 'glass bg-surface-...' or 'glass' with 'neo-glass'
    content = content.replace(/\bglass bg-surface-container-lowest\b/g, 'neo-glass');
    content = content.replace(/\bglass bg-surface-container-low\b/g, 'neo-glass');
    content = content.replace(/\bglass\b/g, 'neo-glass');
    
    // We also want to replace border-related classes if neo-glass provides border
    // content = content.replace(/border border-outline-variant\/20/g, '');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
    }
});

console.log(`Modified ${changedCount} files.`);
