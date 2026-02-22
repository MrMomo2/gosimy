import DodoPayments from 'dodopayments';

const isTestMode = process.env.DODO_PAYMENTS_ENVIRONMENT === 'test' || 
    process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');

function getDodoClient() {
    return new DodoPayments({
        bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
        environment: isTestMode ? 'test_mode' : 'live_mode',
    });
}

export async function getPaymentInvoiceUrl(paymentId: string): Promise<string | null> {
    try {
        const client = getDodoClient();
        
        const response = await client.payments.retrieve(paymentId);
        
        if (response && 'invoice_url' in response && response.invoice_url) {
            return response.invoice_url as string;
        }
        
        const baseUrl = isTestMode 
            ? 'https://test.dodopayments.com' 
            : 'https://dodopayments.com';
        
        return `${baseUrl}/invoices/payments/${paymentId}`;
    } catch (error) {
        console.error('[invoice] Failed to get invoice URL:', error);
        return null;
    }
}

export async function getPaymentDetails(paymentId: string) {
    try {
        const client = getDodoClient();
        const response = await client.payments.retrieve(paymentId);
        return response;
    } catch (error) {
        console.error('[invoice] Failed to get payment details:', error);
        return null;
    }
}
