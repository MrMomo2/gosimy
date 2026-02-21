async function testOrder() {
    const url = "https://lskwritlptfmxeysxihb.supabase.co/rest/v1/orders";
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxza3dyaXRscHRmbXhleXN4aWhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTAwNjcyMiwiZXhwIjoyMDg2NTgyNzIyfQ.ZVOffXHhe6D0TXDp0szsH6MPCX4w5qWNEnkaLYyDfj4";

    const res = await fetch(url + '?select=id', {
        method: 'POST',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            user_id: null,
            status: 'pending',
            currency: 'usd',
            amount_total: 399,
            ip_address: '127.0.0.1'
            // removed stripe_session_id
        })
    });

    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${text}`);
}

testOrder();
