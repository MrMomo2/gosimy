import { Resend } from 'resend';
import { createElement } from 'react';
import EsimDeliveryEmail from './esim-delivery';

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY is not set');
    resendInstance = new Resend(key);
  }
  return resendInstance;
}

export interface EsimDeliveryItem {
  iccid?: string;
  qrCodeUrl?: string;
  activationCode?: string;
  packageName: string;
  countryCode: string;
  durationDays: number;
  volumeBytes: bigint | number | string;
}

interface SendEsimDeliveryEmailParams {
  to: string;
  orderId: string;
  locale?: string;
  esims: EsimDeliveryItem[];
}

export async function sendEsimDeliveryEmail(params: SendEsimDeliveryEmailParams): Promise<void> {
  const resend = getResend();

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'support@gosimy.com';

  // Normalise volumeBytes to number for the email template
  const esims = params.esims.map((e) => ({
    ...e,
    volumeBytes: Number(e.volumeBytes),
  }));

  const { error } = await resend.emails.send({
    from: `Gosimy <${fromEmail}>`,
    to: params.to,
    subject: `Your eSIM is ready — Order #${params.orderId.slice(0, 8).toUpperCase()}`,
    react: createElement(EsimDeliveryEmail, {
      orderId: params.orderId,
      locale: params.locale ?? 'en',
      esims,
    }),
  });

  if (error) throw new Error(`Failed to send email: ${error.message}`);
}
