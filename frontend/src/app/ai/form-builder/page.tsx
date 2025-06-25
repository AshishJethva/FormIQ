'use client';

import dynamic from 'next/dynamic';
import AIFormBuilderLoadingSkeleton from '@/components/skeletons/AIFormBuilderLoadingSkeleton';

const AIFormBuilderPage = dynamic(() => import('./component/builder'), {
  ssr: false,
  loading: () => <AIFormBuilderLoadingSkeleton />,
});

export default function Page() {
  return <AIFormBuilderPage />;
}
