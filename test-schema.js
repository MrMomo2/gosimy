const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // We can't easily run raw arbitrary multi-statement DDL via the standard JS client `rpc` or `from`
    // We will use the REST API gateway's `postgres` meta endpoint, or more simply, we will just format 
    // the commands for the MCP tool since the JS client doesn't support raw SQL queries.

    const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    let combinedSQL = '';
    for (const file of files) {
        if (file.endsWith('.sql')) {
            console.log(`Reading ${file}`);
            const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            combinedSQL += content + '\n\n';
        }
    }

    fs.writeFileSync('full-schema.sql', combinedSQL);
    console.log('Combined schema written to full-schema.sql');
}
run();
