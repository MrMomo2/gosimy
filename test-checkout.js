async function testCheckout() {
    const payload = {
        items: [
            {
                packageCode: "CKH978",
                provider: "esim_access",
                name: "Germany 3GB 30Days",
                countryCode: "DE",
                countryName: "Germany",
                retailPriceCents: 399,
                volumeBytes: "3221225472",
                durationDays: 30,
                quantity: 1
            }
        ],
        locale: "en"
    };

    try {
        const res = await fetch('http://localhost:3000/api/checkout/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Body: ${text}`);
    } catch (err) {
        console.error(err);
    }
}

testCheckout();
