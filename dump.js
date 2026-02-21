const fs = require('fs');

async function getFullSQL() {
    const content = fs.readFileSync('full-schema.sql', 'utf8');
    // Save to a format easy for the text tool
    fs.writeFileSync('push-schema.js', `console.log(JSON.stringify(${JSON.stringify(content)}));`);
}
getFullSQL();
