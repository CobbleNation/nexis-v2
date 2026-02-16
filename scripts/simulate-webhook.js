
const INVOICE_ID = process.argv[2];

if (!INVOICE_ID) {
    console.error('Usage: node scripts/simulate-webhook.js <invoice_id>');
    process.exit(1);
}

const payload = {
    invoiceId: INVOICE_ID,
    status: 'success',
    amount: 19900,
    ccy: 980,
    createdDate: new Date().toISOString(),
    modifiedDate: new Date().toISOString()
};

fetch('http://localhost:3000/api/billing/webhook', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
})
    .then(res => res.json())
    .then(data => console.log('Webhook Response:', data))
    .catch(err => console.error('Webhook Error:', err));
