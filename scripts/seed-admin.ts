import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function seedAdmin() {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    const adminEmail = process.argv[2] || 'admin@gosimy.io';
    
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const user = existingUser.users.find(u => u.email === adminEmail);
    
    if (!user) {
        console.log(`User ${adminEmail} not found. Please create the user first in Supabase Auth.`);
        console.log('Then run this script again to promote them to admin.');
        return;
    }
    
    const { error } = await supabase
        .from('admin_users')
        .upsert({
            user_id: user.id,
            email: user.email,
            role: 'super_admin',
            two_factor_enabled: false,
        }, { onConflict: 'email' });
    
    if (error) {
        console.error('Error creating admin user:', error.message);
    } else {
        console.log(`✓ Admin user created/promoted: ${adminEmail} (super_admin)`);
    }
}

seedAdmin().catch(console.error);
