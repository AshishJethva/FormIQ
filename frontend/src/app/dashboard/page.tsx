'use client';

import dynamic from 'next/dynamic';

// Use dynamic import to prevent hydration errors with Redux
const DashboardPage = dynamic(
  () => import('@/components/dashboard/Dashboard'),
  {
    ssr: false,
  }
);

// Simple export of the dynamically imported component
export default function Page() {
  return <DashboardPage />;
}
