import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from './providers';
import JsonLd from '@/components/JsonLd';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default: 'FormIQ — AI-Powered Form Builder',
    template: '%s | FormIQ',
  },

  description:
    'FormIQ is an AI-powered form builder that lets you create intelligent forms, surveys, and quizzes in seconds. Auto-generate questions using AI, evaluate responses smartly, and collect data effortlessly. Built by Ashish Jethva.',

  keywords: [
    'AI form builder',
    'form builder',
    'online form creator',
    'survey builder',
    'quiz maker',
    'AI forms',
    'form generator',
    'AI response evaluation',
    'smart forms',
    'FormIQ',
    'Ashish Jethva',
    'form management platform',
    'drag and drop form builder',
  ],

  authors: [{ name: 'Ashish Jethva', url: 'https://ashishjethva.com' }],
  creator: 'Ashish Jethva',
  publisher: 'Ashish Jethva',

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: 'FormIQ',
    title: 'FormIQ — AI-Powered Form Builder',
    description:
      'Create intelligent forms, surveys, and quizzes in seconds with AI. Auto-generate questions, evaluate responses, and collect data effortlessly.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'FormIQ — AI-Powered Form Builder by Ashish Jethva',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'FormIQ — AI-Powered Form Builder',
    description:
      'Create intelligent forms, surveys, and quizzes in seconds with AI. Built by @ashish__jethva.',
    creator: '@ashish__jethva',
    site: '@ashish__jethva',
    images: ['/opengraph-image'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/Logo.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/favicon.ico',
    shortcut: '/favicon.ico',
  },

  alternates: {
    canonical: APP_URL,
  },

  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body suppressHydrationWarning={true}>
        <JsonLd />
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
