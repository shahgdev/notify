const fs = require('fs');
const path = require('path');

const targets = [
    { old: /\btext-white\b/g, new: 'text-on-surface' },
    { old: /\bbg-white\/5\b/g, new: 'bg-surface-container-lowest' },
    { old: /\bbg-white\/10\b/g, new: 'bg-surface-container-low' },
    { old: /\bbg-white\/20\b/g, new: 'bg-surface-container' },
    { old: /\bborder-white\/5\b/g, new: 'border-outline-variant\/10' },
    { old: /\bborder-white\/10\b/g, new: 'border-outline-variant\/20' },
    { old: /\bborder-white\/20\b/g, new: 'border-outline-variant\/30' },
];

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
    
    targets.forEach(t => {
        content = content.replace(t.old, t.new);
    });
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
    }
});

console.log(`Modified ${changedCount} files.`);
