const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('c:/Users/Syed Shahmeer/Documents/42/Robotics/Robotics_site/robotics-club/src/app/api');
let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const newContent = content.replace(/catch\s*\(\s*(e|error)\s*:\s*any\s*\)/g, 'catch ($1: unknown)');
    if (content !== newContent) {
        fs.writeFileSync(file, newContent);
        count++;
    }
});
console.log('Fixed ' + count + ' files');
