import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Discover Invest — Hujjatlarni Tasdiqlash va Ijro Nazorati',
  description: 'Discover Invest kompaniyasining ko\'p bosqichli hujjat tasdiqlash va ijro nazorati yagona korporativ tizimi',
  keywords: 'Discover Invest, BPM, hujjat tasdiqlash, workflow, ijro nazorati, di.uz',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" suppressHydrationWarning data-theme="light">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var raw = localStorage.getItem('di_theme_storage');
                  var theme = 'light';
                  if (raw) {
                    var parsed = JSON.parse(raw);
                    if (parsed && parsed.state && parsed.state.theme) {
                      theme = parsed.state.theme;
                    }
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgb(var(--bg-surface))',
              color: 'rgb(var(--text-primary))',
              border: '1px solid rgb(var(--border))',
              boxShadow: '0 10px 30px -4px rgba(0, 0, 0, 0.15)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: 'transparent',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: 'transparent',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
