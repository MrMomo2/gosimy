const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.ESIM_ACCESS_API_KEY;

async function cancelEsim() {
    console.log('Cancelling test eSIM (ICCID: 89852240200021215763)...');

    const response = await axios.post('https://api.esimaccess.com/api/v1/open/esim/cancel', {
        iccid: '89852240200021215763'
    }, {
        headers: {
            'Content-Type': 'application/json',
            'RT-AccessCode': API_KEY
        }
    });

    console.log('Cancel Response:', JSON.stringify(response.data, null, 2));
}

cancelEsim().catch(e => console.error('Cancel Error:', e.response?.data || e.message));
