import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pro-Insight 360 — Evaluate. Diagnose. Transform.',
  description:
    'Professional organisational evaluation, diagnosis and solution recommendation platform by GIS Konsult Ltd.',
  manifest: '/manifest.json',
  themeColor: '#4361ee',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Pro-Insight 360',
    description: 'Evaluate. Diagnose. Transform.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* ── Font preconnect for performance ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4361ee" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('Service worker registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}