const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

const content = `window.env = {
    SUPABASE_URL: "${supabaseUrl}",
    SUPABASE_KEY: "${supabaseKey}"
};`;

fs.writeFileSync('env.js', content);
console.log('✓ env.js generated successfully from Vercel environment variables.');
