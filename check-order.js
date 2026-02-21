const axios = require('axios');
const k = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5em1tdmlqa2V6aWp1a2J6a3BvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUzMTQ4MiwiZXhwIjoyMDg3MTA3NDgyfQ.QoMBMgxV5RjYSk65hpSjG-LnbWMiWbQAc8F60q2X6pI';
const url = 'https://dyzmmvijkezijukbzkpo.supabase.co/rest/v1';
const headers = { apikey: k, Authorization: `Bearer ${k}` };

async function check() {
    const orderId = '3df22ced-6f29-457d-b90d-04626f70d274';

    const order = await axios.get(`${url}/orders?id=eq.${orderId}&select=id,status,guest_email`, { headers });
    console.log('ORDER:', JSON.stringify(order.data, null, 2));

    const items = await axios.get(`${url}/order_items?order_id=eq.${orderId}&select=*`, { headers });
    console.log('ORDER ITEMS:', JSON.stringify(items.data, null, 2));

    const esims = await axios.get(`${url}/esims?order_item_id=eq.${items.data[0]?.id}&select=*`, { headers });
    console.log('ESIMS:', JSON.stringify(esims.data, null, 2));

    const logs = await axios.get(`${url}/fulfillment_log?order_id=eq.${orderId}&select=*`, { headers });
    console.log('FULFILLMENT LOG:', JSON.stringify(logs.data, null, 2));
}

check().catch(e => console.error(e.message));
