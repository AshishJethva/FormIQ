import { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/auth/login',
          '/auth/signup',
          '/auth/forgot-password',
          '/templates/form',
          '/support/contact',
        ],
        disallow: [
          '/dashboard',
          '/build/',
          '/myaccount/',
          '/payment/',
          '/ai/',
          '/form/',
          '/auth/reset-password',
          '/auth/verify',
          '/api/',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
