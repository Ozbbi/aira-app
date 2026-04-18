const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found — did you run expo export first?');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// Add type="module" to script tags that reference .js files in /assets/ or /_expo/
// but don't already have a type attribute
html = html.replace(
  /<script\s+src="([^"]+\.js)"(?![^>]*type=)/g,
  '<script type="module" src="$1"'
);

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ Fixed script tags in dist/index.html');
