// src/app/form-builder/page.tsx
'use client';

import { Suspense } from 'react';
import { Providers } from '@/app/providers';
import FormBuilder from '@/components/form-builder/FormBuilder';

export default function FormBuilderPage() {
  return (
    <Providers>
      <Suspense fallback={<div>Loading form builder...</div>}>
        <FormBuilder />
      </Suspense>
    </Providers>
  );
}
