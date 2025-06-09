// src/app/templates/form/page.tsx
'use client';

import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import FormTemplatesModal from '@/components/modals/FormTemplatesModal';

export default function FormTemplatesPage() {
  return (
    <Provider store={store}>
      <FormTemplatesModal />
    </Provider>
  );
}
