// Debug helper script
const fs = require('fs');
const path = require('path');

// Check that files are present in the correct directories
function checkBuildFiles() {
  console.log('Checking build files...');
  
  // Check if dist directory exists
  const distPath = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distPath)) {
    console.error('❌ dist directory not found. Make sure you ran npm run build first.');
    return false;
  }
  
  // Check if index.html exists in dist
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found in dist directory.');
    return false;
  }
  
  // Check if assets directory exists
  const assetsPath = path.join(distPath, 'assets');
  if (!fs.existsSync(assetsPath)) {
    console.error('❌ assets directory not found in dist.');
  } else {
    // Log assets files
    const assets = fs.readdirSync(assetsPath);
    console.log(`✅ Found ${assets.length} files in assets directory:`);
    assets.forEach(file => console.log(`  - ${file}`));
  }
  
  // Check for common JS files
  console.log('\nChecking for main JS files...');
  const jsFiles = fs.readdirSync(distPath).filter(file => file.endsWith('.js'));
  if (jsFiles.length === 0) {
    console.error('❌ No JS files found in dist directory.');
  } else {
    console.log(`✅ Found ${jsFiles.length} JS files in dist directory:`);
    jsFiles.forEach(file => console.log(`  - ${file}`));
  }
  
  // Read and check index.html content
  console.log('\nAnalyzing index.html references...');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Check for script tags
  const scriptMatches = indexContent.match(/<script[^>]*src="[^"]*"[^>]*>/g) || [];
  console.log(`Found ${scriptMatches.length} script tags in index.html:`);
  scriptMatches.forEach(match => {
    const src = match.match(/src="([^"]*)"/)?.[1];
    console.log(`  - ${src}`);
    
    // Check if the referenced file exists
    if (src && !src.startsWith('http')) {
      const scriptPath = path.join(distPath, src.startsWith('./') ? src.substring(2) : src);
      if (!fs.existsSync(scriptPath)) {
        console.error(`❌ Referenced script not found: ${scriptPath}`);
      } else {
        console.log(`    ✅ File exists`);
      }
    }
  });
  
  return true;
}

// Fix common path issues
function fixPathIssues() {
  console.log('\nAttempting to fix common path issues...');
  
  // Fix index.html paths
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Fix asset paths to be relative
    content = content.replace(/src="\//g, 'src="./');
    content = content.replace(/href="\//g, 'href="./');
    
    fs.writeFileSync(indexPath, content);
    console.log('✅ Updated paths in index.html');
  }
  
  console.log('Done fixing path issues.');
}

console.log('============================');
console.log('Electron Debug Helper');
console.log('============================');

checkBuildFiles();
fixPathIssues();

console.log('\n============================');
console.log('Debug suggestions:');
console.log('1. Check main.js to ensure it is loading the correct path to index.html');
console.log('2. Make sure the vite.config.js has base set to "./"');
console.log('3. Verify all asset paths are relative rather than absolute');
console.log('4. Open DevTools in the app to see any JavaScript errors');
console.log('============================');
