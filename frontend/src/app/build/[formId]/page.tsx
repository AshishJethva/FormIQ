// src/app/form-builder/page.tsx
'use client';

import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import FormBuilderLayout from '@/components/form-builder/FormBuilder';

export default function FormBuilderPage() {
  return (
    <Provider store={store}>
      <FormBuilderLayout />
    </Provider>
  );
}
