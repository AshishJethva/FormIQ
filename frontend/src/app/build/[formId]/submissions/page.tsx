'use client';

import { useParams } from 'next/navigation';
import FormBuilder from '@/components/form-builder/FormBuilder';

export default function FormSubmissionsPage() {
  const params = useParams();
  const formId = params.formId as string;

  return <FormBuilder formId={formId} />;
}
