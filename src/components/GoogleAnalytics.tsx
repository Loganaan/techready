// Optional: Google Analytics Component
// To use, install: npm install @next/third-parties
// Then import and add to layout.tsx

'use client';

import Script from 'next/script';

interface GoogleAnalyticsProps {
  gaId: string;
}

export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  if (!gaId) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

// Usage in layout.tsx:
// import GoogleAnalytics from '@/components/GoogleAnalytics';
// 
// In the body:
// <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
