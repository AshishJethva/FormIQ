'use client';

import dynamic from 'next/dynamic';

const DashboardPage = dynamic(
  () => import('@/components/dashboard/Dashboard'),
  {
    ssr: false,
  }
);

export default function Page() {
  return <DashboardPage />;
}
