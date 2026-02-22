import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface EsimDeliveryEmailProps {
  orderId: string;
  locale?: string;
  esims: Array<{
    iccid?: string;
    qrCodeUrl?: string;
    activationCode?: string;
    iosInstallUrl?: string;
    androidInstallUrl?: string;
    packageName: string;
    countryCode: string;
    durationDays: number;
    volumeBytes: bigint | number;
  }>;
  portalUrl?: string;
}

function formatBytes(bytes: bigint | number): string {
  const b = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  if (b >= 1073741824) return `${(b / 1073741824).toFixed(1)} GB`;
  if (b >= 1048576) return `${(b / 1048576).toFixed(0)} MB`;
  return `${b} B`;
}

export default function EsimDeliveryEmail({
  orderId,
  locale = 'en',
  esims,
  portalUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gosimy.com',
}: EsimDeliveryEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Gosimy eSIM is ready — scan to activate!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your eSIM is Ready! ✈️</Heading>
          <Text style={text}>
            Great news! Your eSIM order #{orderId.slice(0, 8).toUpperCase()} has been
            processed successfully. Here are your eSIM details:
          </Text>

          {esims.map((esim, index) => (
            <Section key={index} style={esimSection}>
              <Heading style={h2}>{esim.packageName}</Heading>
              <Text style={detail}>
                <strong>Data:</strong> {formatBytes(esim.volumeBytes)} •{' '}
                <strong>Duration:</strong> {esim.durationDays} days
              </Text>

              {esim.qrCodeUrl && (
                <Section style={{ textAlign: 'center' as const, margin: '20px 0' }}>
                  <Img
                    src={esim.qrCodeUrl}
                    width="200"
                    height="200"
                    alt="eSIM QR Code"
                    style={{ margin: '0 auto' }}
                  />
                  <Text style={caption}>Scan this QR code in your device settings</Text>
                </Section>
              )}

              {esim.iccid && (
                <Text style={detail}>
                  <strong>ICCID:</strong>{' '}
                  <code style={code}>{esim.iccid}</code>
                </Text>
              )}

              {esim.activationCode && (
                <>
                  <Text style={detail}>
                    <strong>Activation Code:</strong>{' '}
                    <code style={code}>{esim.activationCode}</code>
                  </Text>
                  {esim.iosInstallUrl && (
                    <Section style={{ textAlign: 'center' as const, margin: '16px 0' }}>
                      <Button
                        href={esim.iosInstallUrl}
                        style={iosButton}
                      >
                        Install on iPhone (iOS 17.4+)
                      </Button>
                    </Section>
                  )}
                  {esim.androidInstallUrl && (
                    <Section style={{ textAlign: 'center' as const, margin: '16px 0' }}>
                      <Button
                        href={esim.androidInstallUrl}
                        style={androidButton}
                      >
                        Install on Android
                      </Button>
                    </Section>
                  )}
                </>
              )}
            </Section>
          ))}

          <Hr style={hr} />

          <Heading style={h2}>How to Activate</Heading>
          <Text style={text}>
            1. Go to <strong>Settings → Cellular → Add eSIM</strong> (or equivalent on your device)<br />
            2. Select <strong>Use QR Code</strong> and scan the code above<br />
            3. Or enter the activation code manually<br />
            4. Follow your carrier&apos;s instructions to complete setup
          </Text>

          <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
            <Button
              href={`${portalUrl}/${locale}/portal/${orderId}`}
              style={button}
            >
              View Order in Portal
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Questions? Reply to this email or visit our support page.
            <br />
            Gosimy — Instant eSIMs for travelers worldwide
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px',
  maxWidth: '600px',
  borderRadius: '8px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  marginBottom: '16px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '12px',
};

const text = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '24px',
};

const detail = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '22px',
};

const caption = {
  color: '#888',
  fontSize: '13px',
  textAlign: 'center' as const,
};

const code = {
  fontFamily: 'monospace',
  backgroundColor: '#f4f4f4',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '14px',
};

const esimSection = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '20px',
  border: '1px solid #e5e7eb',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 32px',
  textDecoration: 'none',
};

const iosButton = {
  backgroundColor: '#000000',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '10px 24px',
  textDecoration: 'none',
  display: 'inline-block',
};

const androidButton = {
  backgroundColor: '#34A853',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '10px 24px',
  textDecoration: 'none',
  display: 'inline-block',
};

const footer = {
  color: '#9ca3af',
  fontSize: '13px',
  textAlign: 'center' as const,
};
