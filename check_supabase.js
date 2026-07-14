const fs = require('fs');

const envContent = fs.readFileSync('env.js', 'utf8');
const urlMatch = envContent.match(/SUPABASE_URL:\s*"([^"]+)"/);
const keyMatch = envContent.match(/SUPABASE_KEY:\s*"([^"]+)"/);

if(urlMatch && keyMatch) {
    const url = urlMatch[1];
    const key = keyMatch[1];

    fetch(url + '/rest/v1/system_permissions?select=*', {
        headers: {
            'apikey': key,
            'Authorization': 'Bearer ' + key
        }
    })
    .then(async res => {
        const body = await res.json();
        console.log('GET /system_permissions Status:', res.status);
        console.log('GET Response:', body);
    })
    .catch(e => console.error(e));
} else {
    console.log('Could not parse env.js');
}
