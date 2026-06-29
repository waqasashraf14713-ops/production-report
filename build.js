const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

const content = `window.env = {
    SUPABASE_URL: "${supabaseUrl}",
    SUPABASE_KEY: "${supabaseKey}"
};`;

// 1. Write env.js to the root folder (for local development fallback)
fs.writeFileSync(path.join(__dirname, 'env.js'), content);
console.log('✓ env.js generated successfully in root folder.');

// 2. Ensure public folder exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

// 3. Write env.js to public folder
fs.writeFileSync(path.join(publicDir, 'env.js'), content);
console.log('✓ env.js generated successfully in public folder.');

// 4. Copy other static assets to public folder
const filesToCopy = [
    'index.html', 
    'styles.css', 
    'script.js', 
    'silo.png',
    'silo_dump.js',
    'silo_moisture.js',
    'quality_standards.js',
    'plant_report.js',
    'shift_report_pdf.js',
    'less_excess_pdf.js'
];
filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(publicDir, file);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✓ Copied ${file} to public/`);
    } else {
        console.log(`- Skipping optional file: ${file} (not found)`);
    }
});
