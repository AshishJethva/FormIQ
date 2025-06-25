'use client';

import dynamic from 'next/dynamic';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';

const DashboardPage = dynamic(
  () => import('@/components/dashboard/Dashboard'),
  {
    ssr: false,
    loading: () => <DashboardSkeleton />,
  }
);

export default function Page() {

  return <DashboardPage />;
}
