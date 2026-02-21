import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Force restart

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.dodopayments.com",
      "frame-src https://checkout.dodopayments.com https://test.checkout.dodopayments.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
      {
        // eSIM Access QR code images
        protocol: 'https',
        hostname: '*.esimaccess.com',
      },
      {
        // Unsplash travel photos for hero
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        // eSIM QR code images
        protocol: 'https',
        hostname: 'p.qrsim.net',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    return [
      // Redirect bare domain to English locale
      {
        source: '/shop',
        destination: '/en/shop',
        permanent: true,
      },
    ];
  },

  // Suppress known third-party Webpack build warnings (Prisma/OpenTelemetry)
  webpack: (config, { isServer }) => {
    config.ignoreWarnings = [
      { module: /node_modules\/@opentelemetry\/instrumentation/ },
      { module: /node_modules\/@prisma\/instrumentation/ },
    ];
    return config;
  },
};

export default withNextIntl(nextConfig);
