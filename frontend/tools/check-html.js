// frontend/tools/check-html.js
const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) files = files.concat(walk(full));
    else if (full.endsWith('.html')) files.push(full);
  }
  return files;
}

const pagesDir = path.join(__dirname, '..', 'src', 'pages');
if (!fs.existsSync(pagesDir)) {
  console.error('No existe:', pagesDir);
  process.exit(0);
}

const files = walk(pagesDir);
let bad = 0;
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  const scriptsOpen = (txt.match(/<script\b/gi) || []).length;
  const scriptsClose = (txt.match(/<\/script>/gi) || []).length;
  const divOpen = (txt.match(/<div\b/gi) || []).length;
  const divClose = (txt.match(/<\/div>/gi) || []).length;
  const problems = [];
  if (scriptsOpen !== scriptsClose) problems.push(`scripts: ${scriptsOpen} <> ${scriptsClose}`);
  if (divOpen !== divClose) problems.push(`divs: ${divOpen} <> ${divClose}`);
  if (problems.length) {
    bad++;
    console.log('✖', f);
    problems.forEach(p => console.log('   -', p));
  } else {
    console.log('✔', f);
  }
}
if (bad) {
  console.log(`\nFound ${bad} file(s) with basic mismatches.`);
  process.exit(1);
} else {
  console.log('\nAll good (basic checks passed).');
  process.exit(0);
}
