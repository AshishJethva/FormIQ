// src/app/build/[formId]/publish/page.tsx
'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'next/navigation';
import { loadFormAsync } from '@/redux/slices/formBuilder/formBuilderSlice';
import FormBuilder from '@/components/form-builder/FormBuilder';
import { AppDispatch } from '@/redux/store';

export default function FormPublishPage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  const formId = params.formId as string;

  useEffect(() => {
    if (formId) {
      dispatch(loadFormAsync(formId));
    }
  }, [dispatch, formId]);

  return <FormBuilder />;
}
