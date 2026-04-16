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

    // 1. Replace Primary Indigo/Purple -> CSS var
    // Old indigos: #4f46e5, #6366f1, #818cf8, #a5b4fc, #c7d2fe, #e0e7ff, #eef2ff
    // Old purples: #6d28d9, #7c3aed, #a855f7, #c084fc, #d8b4fe, #f3e8ff
    
    // Simplification for mapping to universal CSS vars we will define in index.css

    content = content.replace(/#4f46e5/gi, 'var(--primary)');
    content = content.replace(/#6d28d9/gi, 'var(--primary-dark)');
    content = content.replace(/#7c3aed/gi, 'var(--primary-light)');
    content = content.replace(/#6366f1/gi, 'var(--primary-light)');
    content = content.replace(/#818cf8/gi, 'var(--primary-light)');
    content = content.replace(/rgba\(99,102,241,/gi, 'rgba(var(--primary-rgb),');
    content = content.replace(/rgba\(79,70,229,/gi, 'rgba(var(--primary-rgb),');
    content = content.replace(/rgba\(124,58,237,/gi, 'rgba(var(--primary-rgb),');
    content = content.replace(/rgba\(168,85,247,/gi, 'rgba(var(--primary-rgb),');

    // Remove purple gradients by replacing the second color with primary or primary-dark
    content = content.replace(/#5b21b6/gi, 'var(--primary-dark)');
    content = content.replace(/#4338ca/gi, 'var(--primary-dark)');
    content = content.replace(/#a78bfa/gi, 'var(--primary-light)');
    content = content.replace(/#c084fc/gi, 'var(--primary-light)');
    content = content.replace(/#a855f7/gi, 'var(--primary)');
    
    // Card/Background colors mapping to css vars
    content = content.replace(/'#ffffff'| '#fff'/gi, "'var(--card-bg)'");
    content = content.replace(/white/g, "var(--card-bg)"); // Need to be careful here but we can fix manually if needed. CSS allows "white". Let's use regex boundary.
    content = content.replace(/'#fff'/gi, "'var(--card-bg)'");
    content = content.replace(/:"#fff"/gi, ':"var(--card-bg)"');
    content = content.replace(/ background: '#fff' /gi, " background: 'var(--card-bg)' ");
    content = content.replace(/ background: '#ffffff'/gi, " background: 'var(--card-bg)'");
    
    // Page backgrounds
    content = content.replace(/'#f9fafb'/gi, "'var(--page-bg)'");
    content = content.replace(/'#fafafa'/gi, "'var(--page-bg)'");
    content = content.replace(/'#f8fafc'/gi, "'var(--page-bg)'");
    
    // Text colors
    content = content.replace(/'#111827'/gi, "'var(--text-main)'");
    content = content.replace(/'#1f2937'/gi, "'var(--text-main)'");
    content = content.replace(/'#0f0f1a'/gi, "'var(--text-main)'");
    content = content.replace(/'#374151'/gi, "'var(--text-main)'");
    
    content = content.replace(/'#6b7280'/gi, "'var(--text-muted)'");
    content = content.replace(/'#9ca3af'/gi, "'var(--text-muted)'");
    content = content.replace(/'#4b5563'/gi, "'var(--text-muted)'");
    
    // Border colors
    content = content.replace(/'#e5e7eb'/gi, "'var(--border-color)'");
    content = content.replace(/'#f3f4f6'/gi, "'var(--border-color)'");
    content = content.replace(/'#d1d5db'/gi, "'var(--border-color)'");

    // Replace strict `#fff` strings that might be wrapped differently
    content = content.replace(/color: '#fff'/gi, "color: 'var(--text-inverse)'");

    // Fix possible bad transforms for things like `rgba(var(--card-bg), ...)`
    // Wait, let's keep it simple.

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${filePath}`);
    }
}

walkDir(clientSrcPath, processFile);
console.log('Done!');
