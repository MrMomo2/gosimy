'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CONSENT_KEY = 'gosimy-cookie-consent';

function hasConsent(): boolean {
    try {
        const stored = localStorage.getItem(CONSENT_KEY);
        if (!stored) return false;
        const parsed = JSON.parse(stored);
        return parsed?.accepted === true;
    } catch {
        return false;
    }
}

/**
 * Loads Google Analytics only after the user accepts cookies via the CookieBanner.
 * Listens for changes to localStorage so it activates immediately after consent.
 */
export function GoogleAnalytics() {
    const [consented, setConsented] = useState(false);

    useEffect(() => {
        // Check on mount
        setConsented(hasConsent());

        // Listen for consent changes (CookieBanner triggers a storage event)
        const onStorage = (e: StorageEvent) => {
            if (e.key === CONSENT_KEY) {
                setConsented(hasConsent());
            }
        };

        // Also listen for a custom event for same-tab consent changes
        const onConsentChange = () => setConsented(hasConsent());

        window.addEventListener('storage', onStorage);
        window.addEventListener('cookie-consent-change', onConsentChange);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('cookie-consent-change', onConsentChange);
        };
    }, []);

    if (!GA_MEASUREMENT_ID || !consented) return null;

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
            </Script>
        </>
    );
}
