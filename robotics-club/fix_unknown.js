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
    
    // We want to replace `e.message` with `(e as Error).message` AND `error.message` with `(error as Error).message`.
    // But ONLY inside catch blocks. Since this is an API folder, it's safe to just replace across the file.
    let newContent = content.replace(/e\.message/g, '(e as Error).message');
    newContent = newContent.replace(/error\.message/g, '(error as Error).message');
    
    // If it was already replaced, we might get ((e as Error) as Error)
    newContent = newContent.replace(/\(\(e as Error\)\s*as\s*Error\)/g, '(e as Error)');
    newContent = newContent.replace(/\(\(error as Error\)\s*as\s*Error\)/g, '(error as Error)');

    if (content !== newContent) {
        fs.writeFileSync(file, newContent);
        count++;
    }
});
console.log('Fixed message typings in ' + count + ' files');
