require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function resetDB() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Emptying all tables to provide a clean slate...");

    const tables = [
        'fulfillment_log',
        'esims',
        'order_items',
        'orders',
    ];

    for (const table of tables) {
        console.log(`Clearing ${table}...`);
        // Delete all records bypassing RLS
        const { error } = await supabase.from(table).delete().gte('created_at', '2000-01-01');
        if (error) {
            console.error(`Failed to clear ${table}:`, error.message);
        } else {
            console.log(`Successfully cleared ${table}`);
        }
    }

    // We should also delete data from user_roles and session_tokens from security migrations
    const securityTables = ['session_tokens', 'user_roles'];
    for (const table of securityTables) {
        console.log(`Clearing ${table}...`);
        const { error } = await supabase.from(table).delete().gte('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
            console.error(`Failed to clear ${table}:`, error.message);
        } else {
            console.log(`Successfully cleared ${table}`);
        }
    }

    console.log("Database cleanup complete!");
}

resetDB();
