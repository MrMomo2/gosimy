import { ImageResponse } from 'next/og';
import { createElement as h } from 'react';

export const runtime = 'nodejs';

export async function GET() {
    return new ImageResponse(
        h('div', {
            style: {
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
                width: '1200px',
                height: '630px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'sans-serif',
                padding: '60px',
            },
        },
            h('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    marginBottom: '32px',
                },
            },
                h('div', {
                    style: {
                        background: 'linear-gradient(135deg, #1e3a8a, #4f46e5)',
                        width: '72px',
                        height: '72px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                },
                    h('span', { style: { color: 'white', fontSize: '44px', fontWeight: 800 } }, 'G')
                ),
                h('span', { style: { color: 'white', fontSize: '64px', fontWeight: 800, letterSpacing: '-2px' } }, 'GOSIMY')
            ),
            h('p', {
                style: {
                    color: '#c7d2fe',
                    fontSize: '36px',
                    fontWeight: 400,
                    margin: '0 0 48px 0',
                    textAlign: 'center',
                },
            }, 'Instant eSIMs for Travelers'),
            h('div', { style: { display: 'flex', gap: '20px', marginBottom: '48px' } },
                ...['150+ Countries', 'Instant Delivery', 'No Roaming Fees'].map((badge) =>
                    h('div', {
                        key: badge,
                        style: {
                            background: 'rgba(99, 102, 241, 0.25)',
                            border: '1px solid rgba(99, 102, 241, 0.5)',
                            borderRadius: '9999px',
                            padding: '10px 24px',
                            color: '#e0e7ff',
                            fontSize: '22px',
                            fontWeight: 500,
                        },
                    }, badge)
                )
            ),
            h('p', { style: { color: '#6366f1', fontSize: '24px', fontWeight: 600, margin: 0 } }, 'gosimy.com')
        ),
        { width: 1200, height: 630 }
    );
}
