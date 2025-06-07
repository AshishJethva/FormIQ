import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'FormIQ | AI-Powered Form Builder',
  description:
    'FormIQ is a powerful, AI-driven online form management platform designed to streamline form creation, smart response evaluation, and data analysis. Build dynamic forms with ease, auto-generate questions using AI prompts, and evaluate answers intelligently.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body suppressHydrationWarning={true}>
        <Providers>
          <main>{children}</main>
          <Toaster
            duration={1000}
            richColors
            position='top-right'
            closeButton={true}
          />
        </Providers>
      </body>
    </html>
  );
}
