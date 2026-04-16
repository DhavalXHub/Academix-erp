const fs = require('fs');
const path = require('path');

const clientSrcPath = path.join(__dirname, 'client/src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

function processFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.css')) return;

    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    content = content.replace(/var\(--card-bg\)Space/g, 'whiteSpace');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${filePath}`);
    }
}

walkDir(clientSrcPath, processFile);
console.log('Done fixing syntax errors!');
